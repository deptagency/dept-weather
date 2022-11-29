import dayjs from 'dayjs';
import Fuse from 'fuse.js';
import { readFile } from 'fs/promises';
import geodist from 'geodist';
import path from 'path';
import {
  CITY_SEARCH_CITIES_BY_ID_FILENAME,
  CITY_SEARCH_CITIES_FILENAME,
  CITY_SEARCH_DATA_FOLDER,
  CITY_SEARCH_DISTANCE_TO_QUERIED_ROUNDING_LEVEL,
  CITY_SEARCH_FUSE_OPTIONS,
  CITY_SEARCH_INDEX_FILENAME,
  CITY_SEARCH_POPULATION_SORT_THRESHOLD,
  CITY_SEARCH_QUERY_CACHE_FILENAME,
  CITY_SEARCH_RESULTS_MAX_AGE,
  CITY_SEARCH_RESULT_LIMIT
} from '@constants';
import { CoordinatesHelper, NumberHelper, SearchQueryHelper } from 'helpers';
import { CitiesById, CitiesQueryCache, City, ClosestCity, FullCity, InputCity } from 'models/cities';
import { Unit } from 'models';
import { Cached } from './cached';
import { LoggerHelper } from './logger-helper';

import leven from 'leven';
import lunr from 'lunr';
import fuzzy from 'fuzzy';
import fuzzysort from 'fuzzysort';
import { FullOptions, MatchData, Searcher, sortKind } from 'fast-fuzzy';

export class CitiesHelper {
  private static readonly CLASS_NAME = 'CitiesHelper';

  private static sortByPopulation(a: FullCity, b: FullCity) {
    return b.population - a.population;
  }

  // Temporarily return with population
  private static mapToCity(extendedCity: City): City {
    return {
      cityName: extendedCity.cityName,
      stateCode: extendedCity.stateCode,
      latitude: extendedCity.latitude,
      longitude: extendedCity.longitude,
      timeZone: extendedCity.timeZone,
      geonameid: extendedCity.geonameid,
      // @ts-ignore
      population: extendedCity.population
    };
  }

  private static async getFile(fName: string) {
    const dataDirectory = path.join(process.cwd(), CITY_SEARCH_DATA_FOLDER);
    const fileContents = await readFile(path.join(dataDirectory, fName), 'utf8');
    return JSON.parse(fileContents);
  }

  private static usCitiesPromise: Promise<FullCity[]> = (async () => {
    const inputCities = (await this.getFile(CITY_SEARCH_CITIES_FILENAME)) as InputCity[];
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
    const citiesById = (await this.getFile(CITY_SEARCH_CITIES_BY_ID_FILENAME)) as CitiesById;
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

  private static _lunrIndex: lunr.Index;
  private static async getLunrIndex(usCities: FullCity[]) {
    if (this._lunrIndex == null) {
      const getFormattedDuration = LoggerHelper.trackPerformance();
      this._lunrIndex = lunr(function () {
        this.field('cityAndStateCode');
        this.ref('geonameid');
        usCities.map(city => this.add({ ...city, cityAndStateCode: city.cityAndStateCode.toLowerCase() }));
      });
      LoggerHelper.getLogger(`${this.CLASS_NAME}.getLunrIndex()`).verbose(`Took ${getFormattedDuration()}`);
    }
    return this._lunrIndex;
  }

  private static fuzzySortCities: (FullCity & { prepared: Fuzzysort.Prepared })[];
  private static async getFuzzysortCities(usCities: FullCity[]) {
    if (this.fuzzySortCities == null) {
      const getFormattedDuration = LoggerHelper.trackPerformance();
      this.fuzzySortCities = [...usCities].map(city => ({
        ...city,
        prepared: fuzzysort.prepare(city.cityAndStateCode)
      }));
      LoggerHelper.getLogger(`${this.CLASS_NAME}.getFuzzysortCities()`).verbose(`Took ${getFormattedDuration()}`);
    }
    return this.fuzzySortCities;
  }

  private static _fastFuzzySearcher: Searcher<FullCity, FullOptions<FullCity>>;
  private static getFastFuzzySearcher(usCities: FullCity[]) {
    if (this._fastFuzzySearcher == null) {
      const getFormattedDuration = LoggerHelper.trackPerformance();
      this._fastFuzzySearcher = new Searcher(usCities, {
        keySelector: city => city.cityAndStateCode,
        threshold: 0.6,
        ignoreCase: true,
        ignoreSymbols: false, // this would strip out commas too; here is the list: `~!@#$%^&*()-=_+{}[]\|\;':",./<>?
        normalizeWhitespace: true,
        returnMatchData: true,
        useDamerau: false,
        useSellers: true,
        useSeparatedUnicode: false,
        sortBy: sortKind.bestMatch
      });
      LoggerHelper.getLogger(`${this.CLASS_NAME}.getFastFuzzySearcher()`).verbose(`Took ${getFormattedDuration()}`);
    }
    return this._fastFuzzySearcher;
  }

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

  static async searchWithFuse(query: string, getFormattedDuration: () => string): Promise<[FullCity[], string]> {
    const fuse = await this.fusePromise;
    const results = fuse.search(query);
    const topResults = this.getTopResults(results);
    const cities = topResults.map(result => result.item);
    return [cities, getFormattedDuration()];
  }

  static async searchWithLeven(
    query: string,
    usCities: FullCity[],
    getFormattedDuration: () => string
  ): Promise<[FullCity[], string]> {
    const usCitiesSortedByLevenDistance = usCities
      .map(city => ({ ...city, levenDistance: leven(query, city.cityAndStateCode.toLowerCase()) }))
      .sort((a, b) => (a.levenDistance < b.levenDistance ? -1 : a.levenDistance > b.levenDistance ? 1 : 0));
    return [usCitiesSortedByLevenDistance.slice(0, CITY_SEARCH_RESULT_LIMIT), getFormattedDuration()];
  }

  static async searchWithLunr(
    query: string,
    usCities: FullCity[],
    getFormattedDuration: () => string
  ): Promise<[FullCity[], string]> {
    const lunrIndex = await this.getLunrIndex(usCities);
    const results = lunrIndex.search(query);
    const topResults = results
      .slice(0, CITY_SEARCH_RESULT_LIMIT)
      .map(lunrResult => usCities.find(city => city.geonameid == Number(lunrResult.ref))!);
    return [topResults, getFormattedDuration()];
  }

  static async searchWithFuzzy(
    query: string,
    usCities: FullCity[],
    getFormattedDuration: () => string
  ): Promise<[FullCity[], string]> {
    const results = fuzzy.filter(query, usCities, {
      extract: city => city.cityAndStateCode.toLowerCase()
    });
    const topResults = results
      .sort((a, b) => (a.score > b.score ? -1 : a.score < b.score ? 1 : 0))
      .slice(0, CITY_SEARCH_RESULT_LIMIT)
      .map(fuzzyResult => usCities[fuzzyResult.index]);
    return [topResults, getFormattedDuration()];
  }

  static async searchWithFuzzysort(
    query: string,
    usCities: FullCity[],
    getFormattedDuration: () => string
  ): Promise<[FullCity[], string]> {
    const fsCities = await this.getFuzzysortCities(usCities);
    const results = fuzzysort.go(query, fsCities, {
      key: 'cityAndStateCode',
      limit: CITY_SEARCH_RESULT_LIMIT
    });
    return [results.map(fuzzysortResult => fuzzysortResult.obj), getFormattedDuration()];
  }

  static async searchWithFastFuzzy(
    query: string,
    usCities: FullCity[],
    getFormattedDuration: () => string
  ): Promise<[FullCity[], string]> {
    const searcher = this.getFastFuzzySearcher(usCities);
    const results = searcher.search(query) as unknown as MatchData<FullCity>[];
    return [results.slice(0, CITY_SEARCH_RESULT_LIMIT).map(result => result.item), getFormattedDuration()];
  }

  static async searchFor(query: string) {
    if (!query.length) {
      return (await this.usTopCitiesPromise).map(this.mapToCity);
    }
    const usCities = await this.usCitiesPromise;
    const getFormattedDuration = LoggerHelper.trackPerformance();
    const searchPkgs = ['Fuse', 'Leven', 'Lunr', 'Fuzzy', 'Fuzzysort', 'FastFuzzy'];
    const allResultsArr = await Promise.all([
      this.searchWithFuse(query, getFormattedDuration),
      this.searchWithLeven(query, usCities, getFormattedDuration),
      this.searchWithLunr(query, usCities, getFormattedDuration),
      this.searchWithFuzzy(query, usCities, getFormattedDuration),
      this.searchWithFuzzysort(query, usCities, getFormattedDuration),
      this.searchWithFastFuzzy(query, usCities, getFormattedDuration)
    ]);
    const allResults: Record<string, [FullCity[], string]> = {};
    searchPkgs.forEach((pkg, idx) => {
      allResults[pkg] = allResultsArr[idx];
    });

    LoggerHelper.getLogger(`${this.CLASS_NAME}.searchFor()`).verbose(
      `"${query}" performance -${Object.keys(allResults)
        .map(key => ` ${key}: ${allResults[key][1]}`)
        .join(', ')}`
    );
    return Object.values(allResults).map(results => results[0].map(this.mapToCity));
  }

  static async getCityWithId(geonameidStr: string) {
    const geonameid = Number(geonameidStr);
    if (Number.isInteger(geonameid) && geonameid > 0) {
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

  private static readonly closestCity = new Cached<ClosestCity | undefined, number[]>(
    async (coordinatesNumArr: number[]) => {
      const usCities = await this.usCitiesPromise;
      let distanceToClosestCity = Number.MAX_SAFE_INTEGER;
      let closestCity: FullCity | undefined;
      for (const city of usCities) {
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
