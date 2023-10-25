import dayjs from 'dayjs';
import { readFile } from 'fs/promises';
import geodist from 'geodist';
import leven from 'leven';
import path from 'path';
import {
  CITY_SEARCH_CITIES_BY_ID_FILENAME,
  CITY_SEARCH_DATA_FOLDER,
  CITY_SEARCH_DISTANCE_TO_QUERIED_ROUNDING_LEVEL,
  CITY_SEARCH_QUERY_CACHE_FILENAME,
  CITY_SEARCH_RESULTS_MAX_AGE
} from 'constants/server';
import { CITY_SEARCH_RESULT_LIMIT } from 'constants/shared';
import { CoordinatesHelper, NumberHelper, SearchQueryHelper } from 'helpers';
import {
  CitiesById,
  CitiesQueryCache,
  City,
  ClosestCity,
  FullCity,
  InputCitiesById,
  ScoredCity,
  SearchResultCity
} from 'models/cities';
import { Unit } from 'models';
import { Cached } from './cached';
import { LoggerHelper } from './logger-helper';

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
    const getFormattedDuration = LoggerHelper.trackPerformance();
    const dataDirectory = path.join(process.cwd(), CITY_SEARCH_DATA_FOLDER);
    const fileContents = await readFile(path.join(dataDirectory, fName), 'utf8');
    const returnVal = JSON.parse(fileContents);
    console.log(`${getFormattedDuration()} for ${this.CLASS_NAME}.getFile(${fName})`);

    return returnVal;
  }

  private static citiesByIdPromise: Promise<CitiesById> = (async () => {
    const citiesById = (await this.getFile(CITY_SEARCH_CITIES_BY_ID_FILENAME)) as InputCitiesById;

    const getFormattedDuration = LoggerHelper.trackPerformance();
    for (const geonameid in citiesById) {
      const value = citiesById[geonameid] as FullCity;
      value.cityAndStateCode = SearchQueryHelper.getCityAndStateCode(value);
      value.cityAndStateCodeLower = value.cityAndStateCode.toLowerCase();
      value.geonameid = geonameid;
    }
    console.log(`${getFormattedDuration()} for ${this.CLASS_NAME}.citiesByIdPromise`);

    return citiesById as CitiesById;
  })();
  private static citiesPromise: Promise<FullCity[]> = (async () => {
    const citiesById = await this.citiesByIdPromise;

    const getFormattedDuration = LoggerHelper.trackPerformance();
    const returnVal = Object.values(citiesById);
    console.log(`${getFormattedDuration()} for ${this.CLASS_NAME}.citiesPromise`);

    return returnVal;
  })();
  private static topCitiesPromise: Promise<FullCity[]> = (async () => {
    const cities = await this.citiesPromise;

    const getFormattedDuration = LoggerHelper.trackPerformance();
    const returnVal = [...cities].sort(this.sortByPopulation).slice(0, CITY_SEARCH_RESULT_LIMIT);
    console.log(`${getFormattedDuration()} for ${this.CLASS_NAME}.topCitiesPromise`);

    return returnVal;
  })();
  private static queryCachePromise: Promise<CitiesQueryCache> = (async () =>
    this.getFile(CITY_SEARCH_QUERY_CACHE_FILENAME))();

  private static getFromCache = async (query: string) => {
    const [queryCache, cities] = await Promise.all([this.queryCachePromise, this.citiesPromise]);

    const item = queryCache[query];
    if (item?.length >= CITY_SEARCH_RESULT_LIMIT) {
      return item.map(refIndex => cities[refIndex]).slice(0, CITY_SEARCH_RESULT_LIMIT);
    }

    return undefined;
  };

  private static getTopResults(results: ScoredCity[]) {
    const topResults: FullCity[] = [];

    // Sort sets of results with same score by population
    for (let start = 0; start < results.length && topResults.length < CITY_SEARCH_RESULT_LIMIT; ) {
      const score = results[start].score;
      let end = start;
      for (; end < results.length; end++) {
        if (results[end].score !== score) {
          break;
        }
      }
      if (end > start) {
        const resultsWithScore = results.slice(start, end);
        const sortedResultsWithScore = [...resultsWithScore]
          .sort(this.sortByPopulation)
          .slice(0, CITY_SEARCH_RESULT_LIMIT - topResults.length);
        topResults.push(...sortedResultsWithScore);
      }
      start = end + 1;
    }

    return topResults;
  }

  static searchWithLeven(query: string, cities: FullCity[]): ScoredCity[] {
    const citiesSortedByLevenScore = cities
      .map(
        (city): ScoredCity => ({
          ...city,
          score:
            city.cityAndStateCodeLower.indexOf(query) > 0
              ? 0.5
              : leven(query, city.cityAndStateCodeLower.slice(0, query.length))
        })
      )
      .sort((a, b) => (a.score < b.score ? -1 : a.score > b.score ? 1 : 0));
    return citiesSortedByLevenScore;
  }

  static async searchFor(query: string) {
    const getFormattedDuration = LoggerHelper.trackPerformance();
    if (!query.length) {
      return (await this.topCitiesPromise).map(this.mapToCity);
    }

    let topResults = await this.getFromCache(query);
    if (topResults == null) {
      const cities = await this.citiesPromise;
      const results = this.searchWithLeven(query, cities);
      topResults = this.getTopResults(results);
    }

    LoggerHelper.getLogger(`${this.CLASS_NAME}.searchFor()`).verbose(`"${query}" took ${getFormattedDuration()}`);
    return topResults.map(this.mapToCity);
  }

  static async getCityWithId(geonameid: string) {
    const geonameidNum = Number(geonameid);
    if (Number.isInteger(geonameidNum) && geonameidNum > 0) {
      const citiesById = await this.citiesByIdPromise;
      const match = citiesById[geonameid];
      if (match != null) {
        return this.mapToCity({
          ...match,
          geonameid: geonameid
        });
      }
    }
  }

  private static readonly closestCity = new Cached<ClosestCity | undefined, number[]>(
    async (coordinatesNumArr: number[]) => {
      const cities = await this.citiesPromise;
      let distanceToClosestCity = Number.MAX_SAFE_INTEGER;
      let closestCity: FullCity | undefined;
      for (const city of cities) {
        const distance = geodist(coordinatesNumArr, CoordinatesHelper.cityToNumArr(city), {
          exact: true,
          unit: Unit.MILES
        });

        if (distance < distanceToClosestCity) {
          closestCity = city;
          distanceToClosestCity = distance;
        }
      }
      return closestCity != null
        ? {
            ...this.mapToCity(closestCity),
            distanceFromQueried: NumberHelper.round(
              distanceToClosestCity,
              CITY_SEARCH_DISTANCE_TO_QUERIED_ROUNDING_LEVEL
            )!
          }
        : undefined;
    },
    async () => dayjs().unix() + CITY_SEARCH_RESULTS_MAX_AGE,
    LoggerHelper.getLogger(`${this.CLASS_NAME}.closestCity`)
  );
  static async getClosestCity(coordinatesNumArr: number[]) {
    const cacheEntry = await this.closestCity.get(CoordinatesHelper.numArrToStr(coordinatesNumArr), coordinatesNumArr);
    return cacheEntry.item;
  }
}
