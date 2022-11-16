// Script to process GeoNames data into JSON format with selected relevant fields
//  Inputs:
//    - "*.txt" files;
//        for each * in COUNTRY_CODES, sourced from: http://download.geonames.org/export/dump/
//  Outputs:
//    - "cities.json" file
//    - "cities-formatted.json" file (unformatted output; you need to run the command below to format it)
//  How to use:
//    1. Run "node .dev/process-cities.js" in the terminal from the root project directory
//    2. Format the "cities-formatted.json" file with "NODE_OPTIONS=--max_old_space_size=8192 npx prettier --write cities-formatted.json"

import { readFile, writeFile } from 'fs/promises';

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
const FEATURE_CODES_TO_EXCLUDE = ['', 'PPLCH', 'PPLH', 'PPLQ', 'PPLW', 'PPLX'];

const run = async () => {
  const files = await Promise.all(COUNTRY_CODES.map(code => readFile(`./.dev/${code}.txt`, 'utf-8')));
  const cities = [];

  for (let i = 0; i < files.length; ++i) {
    const file = files[i];
    const countryCode = COUNTRY_CODES[i];
    const rows = file.split('\n');
    for (const row of rows) {
      const splitRow = row.split('\t');
      const name = splitRow[1];
      const featureClass = splitRow[6];
      const featureCode = splitRow[7];
      if (featureClass === 'P' && !FEATURE_CODES_TO_EXCLUDE.includes(featureCode) && !name.includes('(')) {
        const alternateCityNamesIn = splitRow[3].split(',');
        const alternateCityNames =
          alternateCityNamesIn.length > 1 || alternateCityNamesIn[0]?.length > 0 ? alternateCityNamesIn : [];
        cities.push({
          cityName: splitRow[1],
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
  }

  const stringified = JSON.stringify(cities);
  await writeFile('./.data/cities.json', stringified);
  await writeFile('./cities-formatted.json', stringified);
};

run();
