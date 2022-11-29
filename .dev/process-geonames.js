// Script to process GeoNames data into JSON format with selected relevant fields
//  Inputs:
//    - "*.txt" files, under ".dev/geoname-data";
//        for each * in COUNTRY_CODES, sourced from: http://download.geonames.org/export/dump/
//          The tracked *.md5 files are of the geoname files last used as input (generated with "generate-hashes.sh" script)
//  Outputs:
//    - "cities.json" file
//    - "cities-formatted.json" file (unformatted output; you need to run the command below to format it)
//  How to use:
//    1. Run "node .dev/process-geonames.js" in the terminal from the root project directory
//    2. Format the "cities-formatted.json" file with "NODE_OPTIONS=--max_old_space_size=8192 npx prettier --write .data/cities-formatted.json"

import { DOT_DATA_PATH, GEONAME_DATA_PATH } from './constants.js';
import { cityGeonameidSorter, cityPopulationSorter, write } from './utils.js';

// The following country codes are associated with the United States:
//   US = United States
//   AS = American Samoa
//   GU = Guam
//   MP = Northern Mariana Islands
//   PR = Puerto Rico
//   UM = United States Minor Outlying Islands
//   VI = Virgin Islands
const COUNTRY_CODES = ['US', 'AS', 'GU', 'MP', 'PR', 'UM', 'VI'];

// See http://www.geonames.org/export/codes.html
const FEATURE_CLASSES_AND_CODES = {
  P: ['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLA5', 'PPLC']
};

const run = async () => {
  const files = await Promise.all(COUNTRY_CODES.map(code => readFile(`${GEONAME_DATA_PATH}${code}.txt`, 'utf-8')));
  const cities = [];

  console.log('Processing cities...');
  for (let i = 0; i < files.length; ++i) {
    const file = files[i];
    const countryCode = COUNTRY_CODES[i];
    const rows = file.split('\n');
    for (const row of rows) {
      const splitRow = row.split('\t');
      const cityName = splitRow[1];
      const featureClass = splitRow[6];
      const featureCode = splitRow[7];
      if (FEATURE_CLASSES_AND_CODES[featureClass]?.includes(featureCode) && !cityName.includes('(')) {
        const alternateCityNamesIn = splitRow[3].split(',');
        const alternateCityNames =
          alternateCityNamesIn.length > 1 || alternateCityNamesIn[0]?.length > 0 ? alternateCityNamesIn : [];
        cities.push({
          cityName,
          alternateCityNames,
          stateCode: countryCode === 'US' ? splitRow[10] : countryCode,
          population: Number(splitRow[14]),
          latitude: Number(splitRow[4]),
          longitude: Number(splitRow[5]),
          timeZone: splitRow[17],
          geonameid: Number(splitRow[0]),
          modified: splitRow[18]
        });
      }
    }
    console.log(`  ${COUNTRY_CODES[i]} processed`);
  }

  console.log(`Removing duplicates...`);
  let numDupsRemoved = 0;
  const citiesNoDuplicates = [...cities]
    .sort(cityPopulationSorter)
    .sort((city1, city2) => (!city1.population && !city2.population ? cityGeonameidSorter(city1, city2) : 0))
    .map(city => ({
      ...city,
      cityAndStateCode: `${city.cityName}, ${city.stateCode}`
    }));

  for (let i = 0; i < citiesNoDuplicates.length; i++) {
    for (let j = citiesNoDuplicates.length - 1; j > i; j--) {
      if (citiesNoDuplicates[j].cityAndStateCode === citiesNoDuplicates[i].cityAndStateCode) {
        citiesNoDuplicates.splice(j, 1);
        if (++numDupsRemoved % 100 === 0) {
          console.log(`  ${numDupsRemoved} duplicates removed`);
        }
      }
    }
  }
  console.log(`  ${numDupsRemoved} total duplicates removed; size is now ${citiesNoDuplicates.length}`);

  console.log('Finishing up...');
  const cleanedCities = citiesNoDuplicates
    .map(city => {
      const cleanedCity = { ...city };
      delete cleanedCity.cityAndStateCode;
      return cleanedCity;
    })
    .sort(cityGeonameidSorter);

  await write(`${DOT_DATA_PATH}cities.json`, cleanedCities);
  await write(`${DOT_DATA_PATH}cities-formatted.json`, cleanedCities);
  console.log(' OK!');
};

run();
