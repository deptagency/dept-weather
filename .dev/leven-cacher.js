// Script to create index and/or generate caches (queryCache, cityAndStateCodeCache, and cache)
//  Inputs:
//    - "cities.json" file
//  Outputs:
//    - These files for each N in CACHE_LEVELS:
//        - "cities-topN-query-cache.json":             Object where key is query and value is array of refIndexes of cities.json array
//        - "cities-topN-cityAndStateCode-cache.json":  Object where key is refIndex and value is a string formatted as "City, State"
//        - "cities-topN-gid-cache.json":               Object with gidQueryCache & gidCityAndStateCode keys; values are caches with
//                                                        geonameid values instead of refIndex values
//  How to use:
//    1. Uncomment/comment desired functionality in run() function at end of file
//    2. Run "NODE_OPTIONS=--max_old_space_size=8192 node .dev/leven-cacher.js" in the terminal from the root project directory

import leven from 'leven';
import { DOT_DATA_PATH } from './constants.js';
import { cityPopulationSorter, read, write } from './utils.js';

const CACHE_LEVELS = [50, 500, 1_000, 2_500, 5_000, 10_000, 25_000];

const CITY_SEARCH_RESULT_LIMIT = 5;

const getMinimalCities = async () => {
  const inputCities = await read(`${DOT_DATA_PATH}cities.json`);
  return inputCities.map(inputCity => {
    const cityAndStateCode = `${inputCity.cityName}, ${inputCity.stateCode}`;
    return {
      cityAndStateCode,
      cityAndStateCodeLower: cityAndStateCode.toLowerCase(),
      population: inputCity.population,
      geonameid: inputCity.geonameid
    };
  });
};

const getTopResults = results => {
  const topResults = [];

  // Sort sets of results with same score by population
  for (let start = 0; start < results.length && topResults.length < CITY_SEARCH_RESULT_LIMIT; ) {
    const score = results[start].score;
    let end = start;
    for (; end < results.length; end++) {
      if (results[end].score !== score) {
        break;
      }
    }
    if (end > start) {
      const resultsWithScore = results.slice(start, end);
      const sortedResultsWithScore = [...resultsWithScore]
        .sort(cityPopulationSorter)
        .slice(0, CITY_SEARCH_RESULT_LIMIT - topResults.length);
      topResults.push(...sortedResultsWithScore);
    }
    start = end + 1;
  }

  return topResults;
};

const searchWithLeven = (query, cities) => {
  const citiesSortedByLevenScore = cities
    .map(city => {
      let score = leven(query, city.cityAndStateCodeLower.slice(0, query.length));
      let idxOfQuery = city.cityAndStateCodeLower.indexOf(query);
      if (idxOfQuery === 0) score = 0;
      else if (idxOfQuery > 0) score = 0.5;
      return { ...city, score };
    })
    .sort((a, b) => (a.score < b.score ? -1 : a.score > b.score ? 1 : 0));
  return citiesSortedByLevenScore;
};

const searchFor = (query, cities) => {
  const results = searchWithLeven(query, cities);
  const topResults = getTopResults(results);
  return topResults.map(result => cities.findIndex(city => city.geonameid === result.geonameid));
};

const buildQueryCache = (cities, topCities, startIdx, queryCache) => {
  for (let i = startIdx; i < topCities.length; i++) {
    const fullQuery = topCities[i].cityAndStateCodeLower;
    const consoleTimeLabel = `${i}: ${fullQuery}`;
    console.time(consoleTimeLabel);
    for (let i = fullQuery.length; i > 0; --i) {
      const trimmedQuery = fullQuery.slice(0, i).trim();
      if (queryCache[trimmedQuery] == null) {
        queryCache[trimmedQuery] = searchFor(trimmedQuery, cities);
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

const generateCaches = async (queryCache = {}, cityAndStateCodeCache = {}, startIdx = 0) => {
  const cities = await getMinimalCities();
  const citiesSortedByPop = [...cities].sort(cityPopulationSorter);

  const levels = CACHE_LEVELS.sort((a, b) => a - b).filter(level => level > startIdx);
  const topCities = citiesSortedByPop.slice(0, levels[levels.length - 1]);
  console.log('generating query cache & cityAndStateCode cache for levels:', levels.join(', '));
  console.log();

  for (const level of levels) {
    const generateLabel = `L${level} - build query cache`;
    console.time(generateLabel);
    buildQueryCache(cities, topCities.slice(0, level), startIdx, queryCache);
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
  // Use to get the number of cities with population > 0 and add that number to CACHE_LEVELS
  // const cities = await getMinimalCities();
  // const numCitiesWithPop = cities.filter(city => city.population).length;
  // CACHE_LEVELS.push(numCitiesWithPop);

  // Use for generating a brand new cache
  // await generateCaches();

  // Use for building upon existing caches
  const topN = 30_542;
  const queryCache = await read(`${DOT_DATA_PATH}/cities-top${topN}-query-cache.json`);
  const cityAndStateCodeCache = await read(`${DOT_DATA_PATH}/cities-top${topN}-cityAndStateCode-cache.json`);
  await generateCaches(queryCache, cityAndStateCodeCache, topN);
};

run();
