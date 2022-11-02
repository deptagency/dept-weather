import Fuse from 'fuse.js';
import { readFile } from 'fs/promises';
import path from 'path';
import {
  CITY_SEARCH_FUSE_OPTIONS,
  CITY_SEARCH_POPULATION_SORT_THRESHOLD,
  CITY_SEARCH_RESULT_LIMIT
} from '../constants';
import { ReqQuery } from '../models/api';
import { CitiesQueryCache, City, FullCity, InputCity } from '../models/cities';

export class CitiesHelper {
  private static US_CITIES?: FullCity[];
  private static US_TOP_CITIES?: FullCity[];

  private static sortByPopulation(a: FullCity, b: FullCity) {
    return b.population - a.population;
  }

  private static mapFullCityToCity(fullCity: FullCity): City {
    return {
      cityName: fullCity.cityName,
      stateCode: fullCity.stateCode,
      latitude: fullCity.latitude,
      longitude: fullCity.longitude,
      timeZone: fullCity.timeZone
    };
  }

  private static async getFile(fName: string) {
    const jsonDirectory = path.join(process.cwd(), 'data');
    const fileContents = await readFile(`${jsonDirectory}/${fName}`, 'utf8');
    return JSON.parse(fileContents);
  }

  private static fuseIndexPromise: Promise<Fuse.FuseIndex<FullCity>> = (async () =>
    Fuse.parseIndex(await this.getFile('cities-index.json')))();

  private static fusePromise: Promise<Fuse<FullCity>> = (async () => {
    const fuseIndex = await this.fuseIndexPromise;
    const inputCities = (await this.getFile('cities.json')) as InputCity[];
    this.US_CITIES = inputCities.map(
      (inputCity: InputCity): FullCity => ({
        ...inputCity,
        cityAndStateCode: `${inputCity.cityName}, ${inputCity.stateCode}`
      })
    );
    this.US_TOP_CITIES = [...this.US_CITIES].sort(this.sortByPopulation).slice(0, CITY_SEARCH_RESULT_LIMIT);

    return new Fuse(this.US_CITIES, CITY_SEARCH_FUSE_OPTIONS, fuseIndex);
  })();

  private static queryCachePromise: Promise<CitiesQueryCache> = (async () =>
    this.getFile('cities-query-cache-top500.json'))();

  private static getFromCache = async (query: string) => {
    const queryCache = await this.queryCachePromise;

    const item = queryCache[query.toLowerCase()];
    if (item?.length >= CITY_SEARCH_RESULT_LIMIT) {
      return item.map(refIndex => this.US_CITIES![refIndex]);
    }

    return undefined;
  };

  private static getTopResults(results: Fuse.FuseResult<FullCity>[]) {
    const topResults = results.slice(0, Math.min(results.length, CITY_SEARCH_RESULT_LIMIT));
    // Sort results that score below (i.e., numerically greater than) threshold by population
    const firstBeyondThreshold = topResults.findIndex(
      result => !result.score || result.score > CITY_SEARCH_POPULATION_SORT_THRESHOLD
    );
    const resultsBeyondThreshold = firstBeyondThreshold >= 0 ? topResults.splice(firstBeyondThreshold) : [];
    resultsBeyondThreshold.sort((a, b) => this.sortByPopulation(a.item, b.item));
    topResults.push(...resultsBeyondThreshold);
    return topResults;
  }

  static async searchFor(reqQuery: ReqQuery) {
    const fuse = await this.fusePromise;

    const query = (typeof reqQuery.query === 'string' ? reqQuery.query : '').trim().replaceAll('  ', ' ');
    console.time(query);
    if (!query?.length) {
      return this.US_TOP_CITIES!;
    }

    let cities = await this.getFromCache(query);
    if (cities == null) {
      const results = fuse.search(query);
      const topResults = this.getTopResults(results);
      cities = topResults.map(result => result.item);
    }

    console.timeEnd(query);
    return cities.map(this.mapFullCityToCity);
  }
}
