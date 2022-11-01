import Fuse from 'fuse.js';
import fetch from 'node-fetch';
import { CITY_SEARCH_RESULT_LIMIT } from '../constants';
import { ReqQuery } from '../models/api';
import { City, FullCity, InputCity } from '../models/cities';

export class CitiesHelper {
  private static readonly fuseOptions: Fuse.IFuseOptions<FullCity> = {
    includeScore: true,
    keys: [
      { name: 'cityName', weight: 0.4 },
      { name: 'cityAndStateCode', weight: 0.6 }
    ]
  };

  private static US_FULL_CITIES?: FullCity[];
  private static US_SORTED_TOP_CITIES?: City[];

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

  private static fusePromise: Promise<Fuse<FullCity>> = (async () => {
    const inputCities = (await (await fetch('http://localhost:3000/cities.json')).json()) as InputCity[];
    this.US_FULL_CITIES = inputCities.map(
      (inputCity: InputCity): FullCity => ({
        ...inputCity,
        cityAndStateCode: `${inputCity.cityName}, ${inputCity.stateCode}`
      })
    );
    this.US_SORTED_TOP_CITIES = this.US_FULL_CITIES.sort(this.sortByPopulation)
      .slice(0, CITY_SEARCH_RESULT_LIMIT)
      .map(this.mapFullCityToCity);

    return new Fuse(this.US_FULL_CITIES, this.fuseOptions);
  })();

  private static getTopResults(results: Fuse.FuseResult<FullCity>[]) {
    const topResults = results.slice(0, Math.min(results.length, CITY_SEARCH_RESULT_LIMIT));
    // Sort results that score below threshold by population
    const firstBeyondThreshold = topResults.findIndex(result => !result.score || result.score >= 0.03);
    const resultsBeyondThreshold = firstBeyondThreshold >= 0 ? topResults.splice(firstBeyondThreshold) : [];
    resultsBeyondThreshold.sort((a, b) => this.sortByPopulation(a.item, b.item));
    topResults.push(...resultsBeyondThreshold);
    return topResults;
  }

  static async searchFor(reqQuery: ReqQuery) {
    const fuse = await this.fusePromise;

    const queryStr = (typeof reqQuery.query === 'string' ? reqQuery.query : '').trim().replaceAll('  ', ' ');
    console.time(`search for "${queryStr}"`);
    if (!queryStr?.length) {
      return this.US_SORTED_TOP_CITIES!;
    }

    const results = fuse.search(queryStr);
    const topResults = this.getTopResults(results);
    console.timeEnd(`search for "${queryStr}"`);

    return topResults.map(result => result.item).map(this.mapFullCityToCity);
  }
}
