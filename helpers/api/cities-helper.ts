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
import {
  CitiesById,
  CitiesQueryCache,
  City,
  FullCity,
  InputCity,
  QueriedCoordinates,
  QueriedLocation
} from '../../models/cities';
import { CoordinatesHelper } from '../coordinates-helper';
import { SearchQueryHelper } from '../search-query-helper';
import { NwsHelper } from './nws-helper';
import { LoggerHelper } from './logger-helper';
import { NumberHelper } from '../number-helper';

export class CitiesHelper {
  private static readonly CLASS_NAME = 'CitiesHelper';

  private static sortByPopulation(a: FullCity, b: FullCity) {
    return b.population - a.population;
  }

  private static mapToCity(extendedCity: City): City {
    return {
      cityName: extendedCity.cityName,
      stateCode: extendedCity.stateCode,
      latitude: extendedCity.latitude,
      longitude: extendedCity.longitude,
      timeZone: extendedCity.timeZone,
      geonameid: extendedCity.geonameid
    };
  }

  private static async getFile(fName: string) {
    const publicDirectory = path.join(process.cwd(), process.env.NODE_ENV !== 'production' ? 'public' : '');
    const fileContents = await readFile(`${publicDirectory}/${fName}`, 'utf8');
    return JSON.parse(fileContents);
  }

  private static usCitiesPromise: Promise<FullCity[]> = (async () => {
    const inputCities = (await this.getFile('cities.json')) as InputCity[];
    return inputCities.map(
      (inputCity: InputCity): FullCity => ({
        ...inputCity,
        cityAndStateCode: SearchQueryHelper.getCityAndStateCode(inputCity)
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
    const perfStart = performance.now();
    if (!query.length) {
      return (await this.usTopCitiesPromise).map(this.mapToCity);
    }

    let cities = await this.getFromCache(query);
    if (cities == null) {
      const fuse = await this.fusePromise;
      const results = fuse.search(query);
      const topResults = this.getTopResults(results);
      cities = topResults.map(result => result.item);
    }

    const duration = performance.now() - perfStart;
    const formattedDuration = duration < 1000 ? `${duration}ms` : `${NumberHelper.round(duration / 1_000, 2)}s`;
    LoggerHelper.getLogger(`${this.CLASS_NAME}.searchFor()`).verbose(`"${query}" took ${formattedDuration}`);
    return cities.map(this.mapToCity);
  }

  static async getByGeonameid(geonameidStr: string) {
    const geonameid = Number(geonameidStr);
    if (Number.isInteger(geonameid) && geonameid >= 0) {
      const usCitiesById = await this.usCitiesByIdPromise;
      const match = usCitiesById[String(geonameid)];
      if (match != null) {
        return this.mapToCity({
          ...match,
          geonameid: geonameid
        });
      }
    }
  }

  static async parseQueriedLocation(reqQuery: ReqQuery) {
    const warnings: string[] = [];
    const geonameidStr = reqQuery[API_GEONAMEID_KEY];
    const coordinatesStr = reqQuery[API_COORDINATES_KEY];

    const getReturnValFor = async (partialQueriedLocation: Partial<QueriedLocation> & QueriedCoordinates) => {
      const coordinatesNumArr = CoordinatesHelper.adjustPrecision(
        CoordinatesHelper.cityToNumArr(partialQueriedLocation)
      );
      const queriedLocation: QueriedLocation = {
        latitude: coordinatesNumArr[0],
        longitude: coordinatesNumArr[1],
        timeZone: partialQueriedLocation.timeZone
          ? partialQueriedLocation.timeZone
          : (await NwsHelper.getPoints(CoordinatesHelper.numArrToStr(coordinatesNumArr))).item.properties.timeZone
      };
      return {
        queriedLocation,
        warnings
      };
    };

    // Use "id" queryParam if provided
    if (typeof geonameidStr === 'string' && geonameidStr.length) {
      const matchingCity = await CitiesHelper.getByGeonameid(geonameidStr);
      if (matchingCity != null) {
        if (coordinatesStr != null) {
          warnings.push(`'${API_COORDINATES_KEY}' was ignored since '${API_GEONAMEID_KEY}' takes precedence`);
        }
        return getReturnValFor(matchingCity);
      }
      warnings.push(`'${API_GEONAMEID_KEY}' was invalid`);
    }

    // Use "coordinates" queryParam if provided
    if (typeof coordinatesStr === 'string' && coordinatesStr.length) {
      const inputCoordinatesNumArr = CoordinatesHelper.strToNumArr(coordinatesStr);
      if (CoordinatesHelper.areValid(inputCoordinatesNumArr)) {
        return getReturnValFor({ latitude: inputCoordinatesNumArr[0], longitude: inputCoordinatesNumArr[1] });
      }
      warnings.push(`'${API_COORDINATES_KEY}' was invalid`);
    }

    // Use DEFAULT_CITY coordinates
    warnings.push(
      `Data is for the default city of '${SearchQueryHelper.getCityAndStateCode(
        DEFAULT_CITY
      )}' since neither '${API_GEONAMEID_KEY}' nor '${API_COORDINATES_KEY}' were valid`
    );
    return getReturnValFor(DEFAULT_CITY);
  }
}
