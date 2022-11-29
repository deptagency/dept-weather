// Script to transform array of cities to an object with entries like { geonameid: city, ... } to enable faster lookup by geonameid
//  Inputs:
//    - "cities.json" file
//  Outputs:
//    - "cities-by-id.json" file
//    - "cities-by-id-formatted.json" file (unformatted output; you need to run the command below to format it)
//  How to use:
//    1. Run "node .dev/create-cities-by-id.js" in the terminal from the root project directory
//    2. Format the "cities-by-id-formatted.json" file with "NODE_OPTIONS=--max_old_space_size=8192 npx prettier --write .data/cities-by-id-formatted.json"

import { DOT_DATA_PATH } from './constants.js';
import { read, write } from './utils.js';

const citiesToCitiesById = cities => {
  const citiesById = {};
  for (const city of cities) {
    const cityCopy = { ...city };
    delete cityCopy.geonameid;
    citiesById[city.geonameid] = cityCopy;
  }
  return citiesById;
};

const run = async () => {
  const cities = await read(`${DOT_DATA_PATH}cities.json`);
  const citiesById = citiesToCitiesById(cities);
  await write(`${DOT_DATA_PATH}cities-by-id.json`, citiesById);
  await write(`${DOT_DATA_PATH}cities-by-id-formatted.json`, citiesById);
};

run();
