// Script to create index and/or generate caches (queryCache, cityAndStateCodeCache, and cache)
//  Inputs:
//    - generateIndex():  "cities.json" file
//    - generateCaches(): "cities.json" and "cities-index.json" files
//  Outputs:
//    - generateIndex():  "cities-index.json" file
//    - generateCaches(): these files for each N in CACHE_LEVELS:
//                          - "cities-topN-query-cache.json":             Object where key is query and value is array of refIndexes of cities.json array
//                          - "cities-topN-cityAndStateCode-cache.json":  Object where key is refIndex and value is a string formatted as "City, State"
//                          - "cities-topN-gid-cache.json":               Object with gidQueryCache & gidCityAndStateCode keys; values are caches with geonameid values instead of refIndex values
//  How to use:
//    1. Uncomment/comment desired functionality in run() function at end of file
//    2. Run "node .dev/fuse-tools.js" in the terminal from the root project directory

import Fuse from 'fuse.js';
import { DOT_DATA_PATH } from './constants.js';
import { cityPopulationSorter, read, write } from './utils.js';

// const CACHE_LEVELS = [50, 250, 500, 1_000, 2_500, 5_000, 7_500, 10_000, 12_500, 15_000, 17_500, 20_000, 22_500, 25_000];
const CACHE_LEVELS = [5];

const RESULT_LIMIT = 5;
const POPULATION_SORT_THRESHOLD = 10e-4;
const FUSE_OPTIONS = {
  includeScore: true,
  keys: [
    { name: 'cityAndStateCode', weight: 0.9 },
    { name: 'alternateCityNames', weight: 0.1 }
  ]
};

const getMinimalCities = async () => {
  const inputCities = await read(`${DOT_DATA_PATH}cities.json`);
  return inputCities.map(inputCity => ({
    cityAndStateCode: `${inputCity.cityName}, ${inputCity.stateCode}`,
    alternateCityNames: inputCity.alternateCityNames,
    population: inputCity.population,
    geonameid: inputCity.geonameid
  }));
};

const createIndex = cities => Fuse.createIndex(FUSE_OPTIONS.keys, cities);

const readAndParseIndex = async () => {
  const index = await read(`${DOT_DATA_PATH}/cities-index.json`);
  return Fuse.parseIndex(index);
};

const getFuse = (cities, index) => new Fuse(cities, FUSE_OPTIONS, index);

const searchFor = (fuse, query) => {
  const results = fuse.search(query);
  const topResults = getTopResults(results);
  return topResults.map(result => result.refIndex);
};

const getTopResults = results => {
  const desiredSize = Math.min(results.length, RESULT_LIMIT);
  let idxOfNextElem = desiredSize;
  const topResults = results.slice(0, idxOfNextElem);

  // Sort results that score below (i.e., numerically greater than) threshold by population
  const firstBeyondThreshold = topResults.findIndex(
    result => !result.score || result.score > POPULATION_SORT_THRESHOLD
  );
  const resultsBeyondThreshold = firstBeyondThreshold >= 0 ? topResults.splice(firstBeyondThreshold) : [];
  resultsBeyondThreshold.sort((result1, result2) => cityPopulationSorter(result1.item, result2.item));
  topResults.push(...resultsBeyondThreshold);
  return topResults;
};

const buildQueryCache = async (fuse, cities, startIdx, queryCache) => {
  for (let i = startIdx; i < cities.length; i++) {
    const fullQuery = cities[i].cityAndStateCode.toLowerCase();
    const consoleTimeLabel = `${i}: ${fullQuery}`;
    console.time(consoleTimeLabel);
    const query = fullQuery;
    for (let i = fullQuery.length; i > 0; --i) {
      const trimmedQuery = query.slice(0, i).trim();
      if (queryCache[trimmedQuery] == null) {
        queryCache[trimmedQuery] = await searchFor(fuse, trimmedQuery);
      }
    }
    console.timeEnd(consoleTimeLabel);
  }
};

const getOrderedQueryCache = queryCache => {
  return Object.keys(queryCache)
    .sort()
    .reduce((obj, key) => {
      obj[key] = queryCache[key];
      return obj;
    }, {});
};

const getGidQueryCache = (queryCache, allCities) => {
  const gidQueryCache = {};
  for (const [query, refIdxs] of Object.entries(queryCache)) {
    gidQueryCache[query] = refIdxs.map(refIdx => allCities[refIdx].geonameid);
  }
  return gidQueryCache;
};

const buildCityAndStateCodeCache = (cityAndStateCodeCache, allCities, queryCache) => {
  const queryCacheArrs = Object.values(queryCache);
  for (const queryCacheArr of queryCacheArrs) {
    for (const idx of queryCacheArr) {
      const idxStr = String(idx);
      if (cityAndStateCodeCache[idxStr] == null) {
        cityAndStateCodeCache[idxStr] = allCities[idx].cityAndStateCode;
      }
    }
  }
};

const getGidCityAndStateCodeCache = (cityAndStateCodeCache, allCities) => {
  const gidCityAndStateCodeCache = {};
  for (const [refIdx, cityAndStateCode] of Object.entries(cityAndStateCodeCache)) {
    const geonameidStr = String(allCities[refIdx].geonameid);
    if (gidCityAndStateCodeCache[geonameidStr] == null) {
      gidCityAndStateCodeCache[geonameidStr] = cityAndStateCode;
    }
  }
  return gidCityAndStateCodeCache;
};

const generateIndex = async () => {
  console.time('generate index');
  const cities = await getMinimalCities();
  await write(`${DOT_DATA_PATH}/cities-index.json`, createIndex(cities));
  console.timeEnd('generate index');
};

const generateCaches = async (queryCache = {}, cityAndStateCodeCache = {}, startIdx = 0) => {
  console.time('setup');
  const cities = await getMinimalCities();
  const citiesSortedByPop = [...cities].sort(cityPopulationSorter);

  const index = await readAndParseIndex();
  const fuse = getFuse(cities, index);
  console.timeEnd('setup');

  const levels = CACHE_LEVELS.sort((a, b) => a - b).filter(level => level > startIdx);
  const topCities = citiesSortedByPop.slice(0, levels[levels.length - 1]);
  console.log('generating query cache & cityAndStateCode cache for levels:', levels.join(', '));
  console.log();

  for (const level of levels) {
    const generateLabel = `L${level} - build query cache`;
    console.time(generateLabel);
    await buildQueryCache(fuse, topCities.slice(0, level), startIdx, queryCache);
    startIdx = level;
    console.timeEnd(generateLabel);

    const qcLabel = `L${level} - order & write query cache`;
    console.time(qcLabel);
    const orderedQueryCache = getOrderedQueryCache(queryCache);
    await write(`${DOT_DATA_PATH}cities-top${level}-query-cache.json`, orderedQueryCache);
    console.timeEnd(qcLabel);

    const cascLabel = `L${level} - build & write cityAndStateCode cache`;
    console.time(cascLabel);
    buildCityAndStateCodeCache(cityAndStateCodeCache, cities, queryCache);
    await write(`${DOT_DATA_PATH}cities-top${level}-cityAndStateCode-cache.json`, cityAndStateCodeCache);
    console.timeEnd(cascLabel);

    const gidLabel = `L${level} - build & write gid cache`;
    console.time(gidLabel);
    await write(`${DOT_DATA_PATH}cities-top${level}-gid-cache.json`, {
      gidQueryCache: getGidQueryCache(orderedQueryCache, cities),
      gidCityAndStateCodeCache: getGidCityAndStateCodeCache(cityAndStateCodeCache, cities)
    });
    console.timeEnd(gidLabel);

    console.log();
  }
};

const run = async () => {
  // Use for generating a brand new index & cache
  await generateIndex();
  await generateCaches();

  // Use for building upon existing caches
  // const topN = 25_000;
  // const queryCache = await read(`${DOT_DATA_PATH}/cities-top${topN}-query-cache.json`);
  // const cityAndStateCodeCache = await read(`${DOT_DATA_PATH}/cities-top${topN}-cityAndStateCode-cache.json`);
  // await generateCaches(queryCache, cityAndStateCodeCache, topN);
};

run();
