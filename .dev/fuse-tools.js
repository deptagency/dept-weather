// Script to create index and/or generate query cache (uncomment/comment in run() function at end of file)
//  Required: ./data/cities.json file
//  Set "type": "module" in package.json, then run "node .dev/fuse-tools.js" in the terminal
import { readFile, writeFile } from 'fs/promises';
import Fuse from 'fuse.js';

const QUERY_CACHE_LEVELS = [3, 10, 50, 100, 250, 500, 1_000];

const RESULT_LIMIT = 5;
const POPULATION_SORT_THRESHOLD = 10e-4;
const FUSE_OPTIONS = {
  includeScore: true,
  keys: [
    { name: 'cityAndStateCode', weight: 0.9 },
    { name: 'alternateCityNames', weight: 0.1 }
  ]
};

const readCities = async () => {
  const inputCitiesFile = await readFile('./data/cities.json', 'utf-8');
  const inputCities = JSON.parse(inputCitiesFile);
  return inputCities.map(inputCity => ({
    cityAndStateCode: `${inputCity.cityName}, ${inputCity.stateCode}`,
    alternateCityNames: inputCity.alternateCityNames,
    population: inputCity.population
  }));
};

const createIndex = cities => Fuse.createIndex(FUSE_OPTIONS.keys, cities);

const readIndex = async () => {
  const indexFile = await readFile('./data/cities-index.json', 'utf-8');
  return Fuse.parseIndex(JSON.parse(indexFile));
};

const citySorter = (city1, city2) => city2.population - city1.population;
const getSortedCities = cities => [...cities].sort(citySorter);

const getFuse = (cities, index) => new Fuse(cities, FUSE_OPTIONS, index);

const searchFor = (fuse, query) => {
  const results = fuse.search(query);
  const topResults = getTopResults(results);
  return topResults.map(result => result.refIndex);
};

const getTopResults = results => {
  const topResults = results.slice(0, Math.min(results.length, RESULT_LIMIT));
  // Sort results that score below (i.e., numerically greater than) threshold by population
  const firstBeyondThreshold = topResults.findIndex(
    result => !result.score || result.score > POPULATION_SORT_THRESHOLD
  );
  const resultsBeyondThreshold = firstBeyondThreshold >= 0 ? topResults.splice(firstBeyondThreshold) : [];
  resultsBeyondThreshold.sort((result1, result2) => citySorter(result1.item, result2.item));
  topResults.push(...resultsBeyondThreshold);
  return topResults;
};

const buildQueryCache = async (fuse, cities, queryCache) => {
  for (const i = 0; i < cities.length; i++) {
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

const orderAndWriteQueryCache = async (queryCache, level) => {
  const orderedQueryCache = Object.keys(queryCache)
    .sort()
    .reduce((obj, key) => {
      obj[key] = queryCache[key];
      return obj;
    }, {});

  const orderedQueryCacheStr = JSON.stringify(orderedQueryCache);
  const fName = `./data/cities-query-cache-top${level}.json`;
  await writeFile(fName, orderedQueryCacheStr);
};

const generateIndex = async () => {
  console.time('generate index');
  const usCities = await readCities();
  const index = createIndex(usCities);
  await writeFile('./data/cities-index.json', JSON.stringify(index));
  console.timeEnd('generate index');
};

const generateQueryCache = async () => {
  console.time('setup');
  const usCities = await readCities();
  const usSortedCities = getSortedCities(usCities);

  const index = await readIndex();
  const fuse = getFuse(usCities, index);
  console.timeEnd('setup');

  const levels = QUERY_CACHE_LEVELS.sort((a, b) => a - b);
  const usTopCities = usSortedCities.slice(0, levels[levels.length - 1]);
  console.log('generating query cache for levels:', levels.join(', '));
  console.log();

  const queryCache = {};
  let sliceStart = 0;
  for (const level of levels) {
    const timeLabel = `generate query cache for level ${level}`;
    console.time(timeLabel);
    await buildQueryCache(fuse, usTopCities.slice(sliceStart, level), queryCache);
    sliceStart = level;
    console.timeEnd(timeLabel);
    console.log();

    await orderAndWriteQueryCache(queryCache, level);
  }
};

const run = async () => {
  // await generateIndex();
  await generateQueryCache();
};

run();
