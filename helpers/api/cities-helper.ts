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
import { CitiesById, CitiesQueryCache, City, ClosestCity, FullCity, InputCitiesById, ScoredCity } from 'models/cities';
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

  private static async getFile<T>(fName: string): Promise<T> {
    const dataDirectory = path.join(process.cwd(), CITY_SEARCH_DATA_FOLDER);
    const fileContents = await readFile(path.join(dataDirectory, fName), 'utf8');
    return JSON.parse(fileContents);
  }

  private static citiesByIdPromise: Promise<CitiesById> = (async () => {
    const getFormattedDuration = LoggerHelper.trackPerformance();
    const inputCitiesById: InputCitiesById = await this.getFile<InputCitiesById>(CITY_SEARCH_CITIES_BY_ID_FILENAME);
    // Create a reference alias, for "unpacking" the input array values into a new object
    //  This does NOT copy the array in memory and is only here for typing
    const citiesById = inputCitiesById as unknown as CitiesById;

    for (const geonameid in inputCitiesById) {
      const [cityName, stateCode, population, latitude, longitude, timeZone] = inputCitiesById[geonameid];
      const cityAndStateCode = `${cityName}, ${stateCode}`;

      citiesById[geonameid] = {
        cityName,
        stateCode,
        population,
        latitude,
        longitude,
        timeZone,
        cityAndStateCode,
        cityAndStateCodeLower: cityAndStateCode.toLowerCase(),
        geonameid
      };
    }
    LoggerHelper.getLogger(`citiesByIdPromise`).verbose(getFormattedDuration());

    return citiesById;
  })();
  private static citiesPromise: Promise<FullCity[]> = (async () => {
    const citiesById = await this.citiesByIdPromise;

    const getFormattedDuration = LoggerHelper.trackPerformance();
    const cities = Object.values(citiesById);
    LoggerHelper.getLogger(`citiesPromise`).verbose(getFormattedDuration());

    return cities;
  })();

  private static _topCitiesPromise?: Promise<FullCity[]>;
  private static getTopCities() {
    if (this._topCitiesPromise == null) {
      this._topCitiesPromise = new Promise<FullCity[]>(async resolve => {
        const cities = await this.citiesPromise;

        const getFormattedDuration = LoggerHelper.trackPerformance();
        const topCities = [...cities].sort(this.sortByPopulation).slice(0, CITY_SEARCH_RESULT_LIMIT);
        LoggerHelper.getLogger(`topCitiesPromise`).verbose(getFormattedDuration());

        resolve(topCities);
      });
    }

    return this._topCitiesPromise;
  }

  private static _queryCachePromise?: Promise<CitiesQueryCache>;
  private static getQueryCache() {
    if (this._queryCachePromise == null) {
      this._queryCachePromise = new Promise<CitiesQueryCache>(async resolve => {
        const getFormattedDuration = LoggerHelper.trackPerformance();
        const queryCache = await this.getFile<CitiesQueryCache>(CITY_SEARCH_QUERY_CACHE_FILENAME);
        LoggerHelper.getLogger(`queryCachePromise`).verbose(getFormattedDuration());

        resolve(queryCache);
      });
    }

    return this._queryCachePromise;
  }

  private static getFromCache = async (query: string) => {
    const [cities, queryCache] = await Promise.all([this.citiesPromise, this.getQueryCache()]);
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
      return (await this.getTopCities()).map(this.mapToCity);
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
        return this.mapToCity(match);
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
