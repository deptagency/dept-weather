import {
  CITY_SEARCH_CITIES_BY_ID_FILENAME,
  CITY_SEARCH_DATA_FOLDER,
  CITY_SEARCH_DISTANCE_TO_QUERIED_ROUNDING_LEVEL,
  CITY_SEARCH_QUERY_CACHE_FILENAME,
  CITY_SEARCH_RESULTS_MAX_AGE
} from 'constants/server';
import { CITY_SEARCH_RESULT_LIMIT } from 'constants/shared';
import dayjs from 'dayjs';
import { readFile } from 'fs/promises';
import geodist from 'geodist';
import { Cached } from 'helpers/api/cached';
import { LoggerHelper } from 'helpers/api/logger-helper';
import { CoordinatesHelper } from 'helpers/coordinates-helper';
import { NumberHelper } from 'helpers/number-helper';
import leven from 'leven';
import {
  CitiesById,
  CitiesQueryCache,
  City,
  ClosestCity,
  FullCity,
  InputCitiesById,
  ScoredCity
} from 'models/cities/cities.model';
import { Unit } from 'models/unit.enum';
import path from 'path';

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

    return citiesById;
  })();
  private static citiesPromise: Promise<FullCity[]> = (async () => {
    const citiesById = await this.citiesByIdPromise;
    const cities = Object.values(citiesById);
    return cities;
  })();

  private static _topCitiesPromise?: Promise<FullCity[]>;
  private static getTopCities() {
    if (this._topCitiesPromise == null) {
      this._topCitiesPromise = new Promise<FullCity[]>(resolve => {
        const getFormattedDuration = LoggerHelper.trackPerformance();
        this.citiesPromise.then(cities => {
          const topCities = [...cities].sort(this.sortByPopulation).slice(0, CITY_SEARCH_RESULT_LIMIT);
          LoggerHelper.getLogger(`${this.CLASS_NAME}.searchFor()`).log(`For "", json took ${getFormattedDuration()}`);
          resolve(topCities);
        });
      });
    }

    return this._topCitiesPromise;
  }

  private static _queryCachePromise?: Promise<CitiesQueryCache>;
  private static getQueryCache() {
    if (this._queryCachePromise == null) {
      this._queryCachePromise = new Promise<CitiesQueryCache>(resolve => {
        const getFormattedDuration = LoggerHelper.trackPerformance();
        const queryCache = this.getFile<CitiesQueryCache>(CITY_SEARCH_QUERY_CACHE_FILENAME);
        LoggerHelper.getLogger(`${this.CLASS_NAME}.getQueryCache()`).log(`Took ${getFormattedDuration()}`);
        resolve(queryCache);
      });
    }

    return this._queryCachePromise;
  }

  private static getFromCache = async (query: string) => {
    const getFormattedDuration = LoggerHelper.trackPerformance();
    const [citiesById, queryCache] = await Promise.all([this.citiesByIdPromise, this.getQueryCache()]);
    const item = queryCache[query];
    if (item?.length >= CITY_SEARCH_RESULT_LIMIT) {
      const returnVal = item.map(geonameidNum => citiesById[String(geonameidNum)]).slice(0, CITY_SEARCH_RESULT_LIMIT);
      LoggerHelper.getLogger(`${this.CLASS_NAME}.getFromCache()`).log(
        `For "${query}", json took ${getFormattedDuration()}`
      );

      return returnVal;
    }

    return undefined;
  };

  private static getTopResults(results: ScoredCity[]) {
    const topResults: FullCity[] = [];

    // Sort sets of results with same score by population
    for (let start = 0; start < results.length && topResults.length < CITY_SEARCH_RESULT_LIMIT; ) {
      const score = results[start].score;
      let end = start + 1;
      for (; end < results.length; end++) {
        if (results[end].score !== score) {
          break;
        }
      }

      const resultsWithScore = results.slice(start, end);
      const sortedResultsWithScore = [...resultsWithScore]
        .sort(this.sortByPopulation)
        .slice(0, CITY_SEARCH_RESULT_LIMIT - topResults.length);
      topResults.push(...sortedResultsWithScore);

      start = end;
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

    LoggerHelper.getLogger(`${this.CLASS_NAME}.searchFor()`).log(`"${query}" took ${getFormattedDuration()}`);
    return topResults.map(this.mapToCity);
  }

  static async getCityWithId(geonameid: string) {
    const geonameidNum = Number(geonameid);
    if (Number.isInteger(geonameidNum) && geonameidNum > 0) {
      const getFormattedDuration = LoggerHelper.trackPerformance();
      const citiesById = await this.citiesByIdPromise;
      const match = citiesById[geonameid];
      if (match != null) {
        LoggerHelper.getLogger(`${this.CLASS_NAME}.getCityWithId()`).log(
          `For ${geonameid}, json took ${getFormattedDuration()}`
        );
        return this.mapToCity(match);
      }
    }
  }

  private static readonly closestCity = new Cached<ClosestCity | undefined, number[]>(
    async (coordinatesNumArr: number[]) => {
      const getFormattedDuration = LoggerHelper.trackPerformance();
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
      LoggerHelper.getLogger(`${this.CLASS_NAME}.closestCity`).log(
        `For ${coordinatesNumArr}, json took ${getFormattedDuration()}`
      );
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
