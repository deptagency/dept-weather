import { createWriteStream } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';
import prettier from 'prettier';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

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
    objectStr = await prettier.format(objectStr, { parser: 'json' });
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
  const fileStream = createWriteStream(path, { flags: 'wx' });
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
};
