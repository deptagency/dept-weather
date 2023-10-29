// Script to bundle queryCache & cityAndStateCodeCache top N=CACHE_LEVEL caches to single cache file, to be downloaded by frontend
//  Inputs:
//    - "cities-topN-query-cache.json":                 Object where key is query and value is array of geonameids
//    - "cities-topN-cityAndStateCode-cache.json":      Object where key is geonameid and value is a string formatted as "City, State"
//  Outputs:
//    - "cities-topN-bundled-cache.json":               Object with queryCache & cityAndStateCode key/values
//  How to use:
//    1. Run "node .dev/bundle-caches.js" in the terminal from the root project directory

import { DOT_DATA_PATH } from './constants.js';
import { read, write } from './utils.js';

const CACHE_LEVEL = 10_000;

const run = async () => {
  const queryCache = await read(`${DOT_DATA_PATH}/cities-top${CACHE_LEVEL}-query-cache.json`);
  const cityAndStateCodeCache = await read(`${DOT_DATA_PATH}/cities-top${CACHE_LEVEL}-cityAndStateCode-cache.json`);
  const bundledCache = {
    queryCache,
    cityAndStateCodeCache
  };

  await write(`${DOT_DATA_PATH}cities-top${CACHE_LEVEL}-bundled-cache.json`, bundledCache);
};

run();
