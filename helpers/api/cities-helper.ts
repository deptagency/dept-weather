import Fuse from 'fuse.js';
import { readFile } from 'fs/promises';
import path from 'path';
import {
  API_COORDINATES_KEY,
  API_GEONAMEID_KEY,
  CITY_SEARCH_FUSE_OPTIONS,
  CITY_SEARCH_INDEX_FILENAME,
  CITY_SEARCH_POPULATION_SORT_THRESHOLD,
  CITY_SEARCH_QUERY_CACHE_FILENAME,
  CITY_SEARCH_RESULT_LIMIT,
  DEFAULT_CITY
} from '../../constants';
import { ReqQuery } from '../../models/api';
import { CitiesById, CitiesQueryCache, City, FullCity, InputCity } from '../../models/cities';
import { CoordinatesHelper } from '../coordinates-helper';

export class CitiesHelper {
  private static sortByPopulation(a: FullCity, b: FullCity) {
    return b.population - a.population;
  }

  private static mapFullCityToCity(fullCity: FullCity): City {
    return {
      cityName: fullCity.cityName,
      stateCode: fullCity.stateCode,
      latitude: fullCity.latitude,
      longitude: fullCity.longitude,
      timeZone: fullCity.timeZone,
      geonameid: fullCity.geonameid
    };
  }

  private static async getFile(fName: string) {
    const jsonDirectory = path.join(process.cwd(), 'data');
    const fileContents = await readFile(`${jsonDirectory}/${fName}`, 'utf8');
    return JSON.parse(fileContents);
  }

  private static usCitiesPromise: Promise<FullCity[]> = (async () => {
    const inputCities = (await this.getFile('cities.json')) as InputCity[];
    return inputCities.map(
      (inputCity: InputCity): FullCity => ({
        ...inputCity,
        cityAndStateCode: `${inputCity.cityName}, ${inputCity.stateCode}`
      })
    );
  })();
  private static usTopCitiesPromise: Promise<FullCity[]> = (async () => {
    const usCities = await this.usCitiesPromise;
    return [...usCities].sort(this.sortByPopulation).slice(0, CITY_SEARCH_RESULT_LIMIT);
  })();
  private static usCitiesByIdPromise: Promise<CitiesById> = (async () => {
    const citiesById = (await this.getFile('cities-by-id.json')) as CitiesById;
    return citiesById;
  })();
  private static queryCachePromise: Promise<CitiesQueryCache> = (async () => {
    return this.getFile(CITY_SEARCH_QUERY_CACHE_FILENAME);
  })();

  private static fuseIndexPromise: Promise<Fuse.FuseIndex<FullCity>> = (async () => {
    const unparsedIndex = await this.getFile(CITY_SEARCH_INDEX_FILENAME);
    return Fuse.parseIndex(unparsedIndex);
  })();
  private static fusePromise: Promise<Fuse<FullCity>> = (async () => {
    const usCities = await this.usCitiesPromise;
    const fuseIndex = await this.fuseIndexPromise;
    return new Fuse(usCities, CITY_SEARCH_FUSE_OPTIONS, fuseIndex);
  })();

  private static getFromCache = async (query: string) => {
    const queryCache = await this.queryCachePromise;
    const usCities = await this.usCitiesPromise;

    const item = queryCache[query.toLowerCase()];
    if (item?.length >= CITY_SEARCH_RESULT_LIMIT) {
      return item.map(refIndex => usCities[refIndex]);
    }

    return undefined;
  };

  private static getIdxOfDuplicateToRemove(topResults: Fuse.FuseResult<FullCity>[]) {
    // Loop through array backwards and compare i index with first occurring element with the same cityAndStateCode
    for (let i = topResults.length - 1; i > 0; --i) {
      const firstMatchIdxInArr = topResults.findIndex(
        (result: Fuse.FuseResult<FullCity>) => result.item.cityAndStateCode === topResults[i].item.cityAndStateCode
      );
      if (firstMatchIdxInArr !== i) {
        // There is more than one element with the same cityAndStateCode
        //  Return the index of the first occurring element if the population of the last occurring element is greater
        const idxToRemove =
          topResults[firstMatchIdxInArr].item.population < topResults[i].item.population ? firstMatchIdxInArr : i;
        return idxToRemove;
      }
    }
    return undefined;
  }

  private static getTopResults(results: Fuse.FuseResult<FullCity>[]) {
    const desiredSize = Math.min(results.length, CITY_SEARCH_RESULT_LIMIT);
    let idxOfNextElem = desiredSize;
    const topResults = results.slice(0, idxOfNextElem);

    // Greedily remove duplicates from topResults and replace them if there are more elements in results
    let idxOfDuplicateToRemove: number | undefined;
    while ((idxOfDuplicateToRemove = this.getIdxOfDuplicateToRemove(topResults)) !== undefined) {
      topResults.splice(idxOfDuplicateToRemove, 1);
      if (results.length > idxOfNextElem) {
        topResults.push(results[idxOfNextElem++]);
      }
    }

    // Sort results that score below (i.e., numerically greater than) threshold by population
    const firstBeyondThreshold = topResults.findIndex(
      result => !result.score || result.score > CITY_SEARCH_POPULATION_SORT_THRESHOLD
    );
    const resultsBeyondThreshold = firstBeyondThreshold >= 0 ? topResults.splice(firstBeyondThreshold) : [];
    resultsBeyondThreshold.sort((a, b) => this.sortByPopulation(a.item, b.item));
    topResults.push(...resultsBeyondThreshold);
    return topResults;
  }

  static async searchFor(query: string) {
    console.time(query);
    if (!query.length) {
      return (await this.usTopCitiesPromise).map(this.mapFullCityToCity);
    }

    let cities = await this.getFromCache(query);
    if (cities == null) {
      const fuse = await this.fusePromise;
      const results = fuse.search(query);
      const topResults = this.getTopResults(results);
      cities = topResults.map(result => result.item);
    }

    console.timeEnd(query);
    return cities.map(this.mapFullCityToCity);
  }

  static async getByGeonameid(geonameid: number) {
    const usCitiesById = await this.usCitiesByIdPromise;
    return usCitiesById[String(geonameid)];
  }

  static async parseReqCoordinates(reqQuery: ReqQuery) {
    const warnings: string[] = [];

    const getReturnValFor = (coordinatesNumArr: number[]) => ({
      coordinatesStr: CoordinatesHelper.numArrToStr(CoordinatesHelper.adjustPrecision(coordinatesNumArr)),
      warnings
    });

    // Use "coordinates" queryParam if provided
    if (typeof reqQuery[API_COORDINATES_KEY] === 'string' && reqQuery[API_COORDINATES_KEY]?.length) {
      const inputCoordinatesNumArr = CoordinatesHelper.strToNumArr(reqQuery[API_COORDINATES_KEY]);
      if (CoordinatesHelper.areValid(inputCoordinatesNumArr)) {
        return getReturnValFor(inputCoordinatesNumArr);
      }
      warnings.push(`The received '${API_COORDINATES_KEY}' query param value was invalid`);
    }

    // Use "geonameid" queryParam if provided
    if (typeof reqQuery[API_GEONAMEID_KEY] === 'string' && reqQuery[API_GEONAMEID_KEY]?.length) {
      const geonameid = Number(reqQuery[API_GEONAMEID_KEY]);
      if (Number.isInteger(geonameid) && geonameid >= 0) {
        const matchingCity = await CitiesHelper.getByGeonameid(geonameid);
        if (matchingCity != null) {
          return getReturnValFor(CoordinatesHelper.cityToNumArr(matchingCity));
        }
      }
      warnings.push(`The received '${API_GEONAMEID_KEY}' query param value was invalid`);
    }

    // Use DEFAULT_CITY coordinates
    warnings.push(`Data is for the default city of '${DEFAULT_CITY.cityName}, ${DEFAULT_CITY.stateCode}'`);
    return getReturnValFor(CoordinatesHelper.cityToNumArr(DEFAULT_CITY));
  }
}
