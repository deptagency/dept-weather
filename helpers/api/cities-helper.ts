import {
  CITY_SEARCH_CITIES_FILENAME,
  CITY_SEARCH_DATA_FOLDER,
  CITY_SEARCH_DISTANCE_TO_QUERIED_ROUNDING_LEVEL,
  CITY_SEARCH_RESULTS_MAX_AGE
} from 'constants/server';
import { CITY_SEARCH_RESULT_LIMIT } from 'constants/shared';
import dayjs from 'dayjs';
import { readFile } from 'fs/promises';
import { Cached } from 'helpers/api/cached';
import { db } from 'helpers/api/database';
import { LoggerHelper } from 'helpers/api/logger-helper';
import { CoordinatesHelper } from 'helpers/coordinates-helper';
import { NumberHelper } from 'helpers/number-helper';
import { SearchQueryHelper } from 'helpers/search-query-helper';
import { sql } from 'kysely';
import leven from 'leven';
import { City, ClosestCity, FullCity, InputCity, ScoredCity } from 'models/cities/cities.model';
import path from 'path';

export class CitiesHelper {
  private static readonly CLASS_NAME = 'CitiesHelper';

  private static sortByPopulation(a: FullCity, b: FullCity) {
    return b.population - a.population;
  }

  private static mapToCity(extendedCity: City & Partial<FullCity>): City {
    return {
      cityName: extendedCity.cityName,
      stateCode: extendedCity.stateCode,
      latitude: typeof extendedCity.latitude === 'string' ? Number(extendedCity.latitude) : extendedCity.latitude,
      longitude: typeof extendedCity.longitude === 'string' ? Number(extendedCity.longitude) : extendedCity.longitude,
      timeZone: extendedCity.timeZone,
      geonameid: extendedCity.geonameid
    };
  }

  private static async getFile<T>(fName: string): Promise<T> {
    const dataDirectory = path.join(process.cwd(), CITY_SEARCH_DATA_FOLDER);
    const fileContents = await readFile(path.join(dataDirectory, fName), 'utf8');
    return JSON.parse(fileContents);
  }

  private static _citiesFromFilePromise?: Promise<FullCity[]>;
  private static getCitiesFromFile() {
    if (this._citiesFromFilePromise == null) {
      this._citiesFromFilePromise = new Promise<FullCity[]>(resolve => {
        const getFormattedDuration = LoggerHelper.trackPerformance();
        this.getFile<InputCity[]>(CITY_SEARCH_CITIES_FILENAME).then(inputCities => {
          const cities = inputCities.map((inputCity: InputCity): FullCity => {
            const cityAndStateCode = SearchQueryHelper.getCityAndStateCode(inputCity);
            return {
              ...inputCity,
              cityAndStateCode,
              cityAndStateCodeLower: cityAndStateCode.toLowerCase()
            };
          });
          LoggerHelper.getLogger(`${this.CLASS_NAME}.getCitiesFromFile()`).verbose(`Took ${getFormattedDuration()}`);
          resolve(cities);
        });
      });
    }

    return this._citiesFromFilePromise;
  }

  private static getFromCache = async (query: string) => {
    const getFormattedDuration = LoggerHelper.trackPerformance();

    const results = await db
      .selectFrom('queryCache as qc')
      .where('qc.query', '=', query)
      .innerJoin('cities as c', eb => eb.on('c.geonameid', 'in', sql`(qc.gid0, qc.gid1, qc.gid2, qc.gid3, qc.gid4)`))
      .orderBy(
        sql`CASE c.geonameid
              WHEN qc.gid0 THEN 1
              WHEN qc.gid1 THEN 2
              WHEN qc.gid2 THEN 3
              WHEN qc.gid3 THEN 4
              WHEN qc.gid4 THEN 5
            END;`
      )
      .select(['c.cityName', 'c.stateCode', 'c.latitude', 'c.longitude', 'c.timeZone', 'c.geonameid'])
      .execute();

    LoggerHelper.getLogger(`${this.CLASS_NAME}.getFromCache()`).verbose(
      `For "${query}", db took ${getFormattedDuration()}`
    );
    return results?.length === CITY_SEARCH_RESULT_LIMIT ? results : undefined;
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
            // TODO - potentially run leven algorithm using SQL
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
      const getFormattedDuration = LoggerHelper.trackPerformance();
      const topCities = await db
        .selectFrom('cities')
        .select(['cityName', 'stateCode', 'latitude', 'longitude', 'timeZone', 'geonameid'])
        .orderBy('population', 'desc')
        .limit(CITY_SEARCH_RESULT_LIMIT)
        .execute();
      LoggerHelper.getLogger(`${this.CLASS_NAME}.searchFor()`).verbose(`For "", db took ${getFormattedDuration()}`);
      return topCities.map(this.mapToCity);
    }

    let topResults = await this.getFromCache(query);
    if (topResults == null) {
      // TODO - is reading from file ok? It does not seem viable to select >100k rows at once
      // const cities = await this.db.selectFrom('cities').selectAll().execute();
      const cities = await this.getCitiesFromFile();
      const results = this.searchWithLeven(query, cities);
      topResults = this.getTopResults(results);
    }

    LoggerHelper.getLogger(`${this.CLASS_NAME}.searchFor()`).verbose(`"${query}" took ${getFormattedDuration()}`);
    return topResults.map(this.mapToCity);
  }

  static async getCityWithId(geonameidStr: string) {
    const geonameid = Number(geonameidStr);
    if (Number.isInteger(geonameid) && geonameid > 0) {
      const getFormattedDuration = LoggerHelper.trackPerformance();
      const city = await db
        .selectFrom('cities')
        .select(['cityName', 'stateCode', 'latitude', 'longitude', 'timeZone', 'geonameid'])
        .where('geonameid', '=', geonameid)
        .executeTakeFirst();
      LoggerHelper.getLogger(`${this.CLASS_NAME}.getCityWithId()`).verbose(
        `For ${geonameid}, db took ${getFormattedDuration()}`
      );
      return city;
    }
  }

  private static readonly closestCity = new Cached<ClosestCity | undefined, number[]>(
    async (coordinatesNumArr: number[]) => {
      const getFormattedDuration = LoggerHelper.trackPerformance();
      const closestCity = await db
        .selectFrom('cities')
        .select(['cityName', 'stateCode', 'latitude', 'longitude', 'timeZone', 'geonameid'])
        .select(
          // Calculates distance in miles by using haversine formula
          sql<number>`3959 * ACOS(COS(RADIANS(${coordinatesNumArr[0]})) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(${coordinatesNumArr[1]})) + SIN(RADIANS(${coordinatesNumArr[0]})) * SIN(RADIANS(latitude)))`.as(
            'distanceFromQueried'
          )
        )
        .orderBy('distanceFromQueried')
        .limit(1)
        .executeTakeFirst();
      LoggerHelper.getLogger(`${this.CLASS_NAME}.closestCity`).verbose(
        `For ${coordinatesNumArr}, db took ${getFormattedDuration()}`
      );

      if (closestCity != null) {
        closestCity.distanceFromQueried = NumberHelper.round(
          closestCity.distanceFromQueried,
          CITY_SEARCH_DISTANCE_TO_QUERIED_ROUNDING_LEVEL
        )!;
        return closestCity;
      }
    },
    async () => dayjs().unix() + CITY_SEARCH_RESULTS_MAX_AGE,
    LoggerHelper.getLogger(`${this.CLASS_NAME}.closestCity`)
  );
  static async getClosestCity(coordinatesNumArr: number[]) {
    const cacheEntry = await this.closestCity.get(CoordinatesHelper.numArrToStr(coordinatesNumArr), coordinatesNumArr);
    return cacheEntry.item;
  }
}
