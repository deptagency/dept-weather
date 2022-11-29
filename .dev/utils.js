import { readFile, writeFile } from 'fs/promises';

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

export const write = async (fName, object) => {
  const objectStr = JSON.stringify(object);
  await writeFile(fName, objectStr);
  return objectStr;
};
