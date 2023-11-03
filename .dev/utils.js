import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createWriteStream } from 'fs';
import { readdir, readFile, unlink, writeFile } from 'fs/promises';
import { Kysely } from 'kysely';
import { PlanetScaleDialect } from 'kysely-planetscale';
import fetch from 'node-fetch';
import prettier from 'prettier';
import { DOT_DATA_PATH, QUERY_CACHE_FILE_REGEX } from './constants.js';

export const cityGeonameidSorter = (city1, city2) => city1.geonameid - city2.geonameid;
export const cityPopulationSorter = (city1, city2) => city2.population - city1.population;

export const read = async fName => {
  const inputFile = await readFile(fName, 'utf-8');
  if (fName.endsWith('.json')) {
    const inputObj = JSON.parse(inputFile);
    return inputObj;
  }
  return inputFile;
};

export const write = async (fName, object, shouldFormat = false) => {
  let objectStr = JSON.stringify(object);
  if (shouldFormat) {
    objectStr = prettier.format(objectStr, { parser: 'json' });
  }
  await writeFile(fName, objectStr);
  return objectStr;
};

export const deleteFile = async fName => {
  try {
    await unlink(fName);
  } catch (error) {
    console.error(`Error when deleting "${fName}": ${error.message}`);
  }
};

export const download = async (url, path) => {
  const res = await fetch(url);
  const fileStream = createWriteStream(path);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });
};

export const getMaxNExistingQueryCache = async () => {
  const dotDataFiles = await readdir(DOT_DATA_PATH);
  const queryCacheFiles = dotDataFiles
    .filter(fName => QUERY_CACHE_FILE_REGEX.test(fName))
    .map(fName => ({ fName, topN: fName.match(QUERY_CACHE_FILE_REGEX)[1] }))
    .sort((a, b) => b.topN - a.topN);
  if (queryCacheFiles.length === 0) {
    console.error('Could not find any existing query cache files!');
    process.exit(1);
  }
  return queryCacheFiles[0];
};

export const db = new Kysely({
  dialect: new PlanetScaleDialect({
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD
  })
});
