// Script to transform array of cities to an object with entries like { geonameid: city, ... } to enable faster lookup by geonameid
//  Inputs:
//    - "cities.json" file
//  Outputs:
//    - "cities-by-id.json" file
//    - "cities-by-id-formatted.json" file (unformatted output; you need to run the command below to format it)
//  How to use:
//    1. Run "node .dev/create-cities-by-id.js" in the terminal from the root project directory
//    2. Format the "cities-by-id-formatted.json" file with "NODE_OPTIONS=--max_old_space_size=8192 npx prettier --write cities-by-id-formatted.json"

import { readFile, writeFile } from 'fs/promises';

const write = async (object, fName) => {
  const objectStr = JSON.stringify(object);
  await writeFile(fName, objectStr);
};

const readCities = async () => {
  const inputCitiesFile = await readFile('./.data/cities.json', 'utf-8');
  const inputCities = JSON.parse(inputCitiesFile);
  return inputCities;
};

const transformCities = cities => {
  const citiesById = {};
  for (const city of cities) {
    const cityCopy = { ...city };
    delete cityCopy.geonameid;
    citiesById[city.geonameid] = cityCopy;
  }
  return citiesById;
};

const getOrderedCitiesById = citiesById => {
  return Object.keys(citiesById)
    .sort()
    .reduce((obj, key) => {
      obj[key] = citiesById[key];
      return obj;
    }, {});
};

const run = async () => {
  const cities = await readCities();
  const citiesById = transformCities(cities);
  const orderedCitiesById = getOrderedCitiesById(citiesById);

  await write(orderedCitiesById, `./.data/cities-by-id.json`);
  await write(orderedCitiesById, `./.data/cities-by-id-formatted.json`);
};

run();
