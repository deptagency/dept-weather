// Script to process GeoNames data into JSON format with selected relevant fields
import { readFile, writeFile } from 'fs/promises';

// See http://www.geonames.org/export/codes.html
const FEATURE_CODES_TO_EXCLUDE = ['', 'PPLCH', 'PPLH', 'PPLQ', 'PPLW', 'PPLX'];

const run = async () => {
  const f = await readFile('./US.txt', 'utf-8');
  const rows = f.split('\n');
  const cities = [];
  for (const row of rows) {
    const splitRow = row.split('\t');
    const name = splitRow[1];
    const featureClass = splitRow[6];
    const featureCode = splitRow[7];
    if (featureClass === 'P' && !FEATURE_CODES_TO_EXCLUDE.includes(featureCode) && !name.includes('(')) {
      cities.push({
        cityName: splitRow[1],
        stateCode: splitRow[10],
        population: Number(splitRow[14]),
        latitude: Number(splitRow[4]),
        longitude: Number(splitRow[5]),
        timeZone: splitRow[17],
        geonameid: Number(splitRow[0]),
        modified: splitRow[18]
      });
    }
  }

  await writeFile('./cities.json', JSON.stringify(cities));
};

run();
