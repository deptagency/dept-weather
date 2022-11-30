// Script to process GeoNames data into JSON format with selected relevant fields
//  Inputs:
//    - The getGeonameData() function gets the necessary inputs automatically
//  Outputs:
//    - "cities.json" file
//    - "cities-formatted.json" file
//  How to use:
//    1. Uncomment/comment desired functionality in run() function at end of file
//    2. Run "NODE_OPTIONS=--max_old_space_size=8192 node .dev/process-geonames.js" in the terminal from the root project directory

import extractZip from 'extract-zip';
import md5File from 'md5-file';
import path from 'path';
import {
  DOT_DATA_PATH,
  DOWNLOAD_GEONAMES_URL,
  GEONAME_DATA_PATH,
  GEONAME_EXTRACTED_README_FNAME
} from './constants.js';
import { cityGeonameidSorter, cityPopulationSorter, deleteFile, download, read, write } from './utils.js';

// The following country codes are associated with the United States:
//   US = United States
//   AS = American Samoa
//   GU = Guam
//   MP = Northern Mariana Islands
//   PR = Puerto Rico
//   UM = United States Minor Outlying Islands
//   VI = Virgin Islands
const COUNTRY_CODES = ['US', 'AS', 'GU', 'MP', 'PR', 'UM', 'VI'];
const COUNTRY_CODE_ZIP_FNAMES = COUNTRY_CODES.map(code => `${code}.zip`);
const COUNTRY_CODE_TXT_FNAMES = COUNTRY_CODES.map(code => `${code}.txt`);

// See http://www.geonames.org/export/codes.html
const FEATURE_CLASSES_AND_CODES = {
  P: ['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLA5', 'PPLC']
};

const downloadGeonamesZips = async () =>
  Promise.all(
    COUNTRY_CODE_ZIP_FNAMES.map(async fName =>
      download(`${DOWNLOAD_GEONAMES_URL}${fName}`, `${GEONAME_DATA_PATH}${fName}`)
    )
  );

const extractGeonamesZips = async () =>
  Promise.all(
    COUNTRY_CODE_ZIP_FNAMES.map(async fName =>
      extractZip(`${GEONAME_DATA_PATH}${fName}`, { dir: path.resolve(process.cwd(), GEONAME_DATA_PATH) })
    )
  );

const deleteGeonamesZips = async () =>
  Promise.all(COUNTRY_CODE_ZIP_FNAMES.map(async fName => deleteFile(`${GEONAME_DATA_PATH}${fName}`)));

const generateGeonamesChecksums = async () => {
  const md5Checksums = {};
  for (const fName of COUNTRY_CODE_TXT_FNAMES) {
    const checksum = await md5File(`${GEONAME_DATA_PATH}${fName}`);
    md5Checksums[fName] = checksum;
  }
  await write(`${GEONAME_DATA_PATH}_checksums.json`, md5Checksums, true);
};

const getGeonameData = async () => {
  console.log(`Downloading zip files...`);
  await downloadGeonamesZips();
  console.log(`Extracting txt files from zip files...`);
  await extractGeonamesZips();
  console.log(`Deleting zip files...`);
  await deleteGeonamesZips();
  await deleteFile(GEONAME_EXTRACTED_README_FNAME);
  console.log(`Generating checksums for txt files...`);
  await generateGeonamesChecksums();
};

const processGeonameData = async () => {
  const files = await Promise.all(COUNTRY_CODES.map(code => read(`${GEONAME_DATA_PATH}${code}.txt`)));
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
        // const alternateCityNamesIn = splitRow[3].split(',');
        // const alternateCityNames =
        //   alternateCityNamesIn.length > 1 || alternateCityNamesIn[0]?.length > 0 ? alternateCityNamesIn : [];
        cities.push({
          cityName,
          // alternateCityNames,
          stateCode: countryCode === 'US' ? splitRow[10] : countryCode,
          population: Number(splitRow[14]),
          latitude: Number(splitRow[4]),
          longitude: Number(splitRow[5]),
          timeZone: splitRow[17],
          geonameid: Number(splitRow[0])
          // modified: splitRow[18]
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
  await write(`${DOT_DATA_PATH}cities-formatted.json`, cleanedCities, true);
  console.log(' OK!');
};

const run = async () => {
  await getGeonameData();
  await processGeonameData();
};

run();
