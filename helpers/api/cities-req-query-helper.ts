import { API_COORDINATES_KEY, API_GEONAMEID_KEY, API_SEARCH_QUERY_KEY, DEFAULT_CITY } from '@constants';
import { CoordinatesHelper, SearchQueryHelper } from 'helpers';
import { ReqQuery } from 'models/api';
import { City, ClosestCity, MinimalQueriedCity } from 'models/cities';
import { CitiesHelper } from './cities-helper';
import { LoggerHelper } from './logger-helper';

export class CitiesReqQueryHelper {
  private static readonly CLASS_NAME = 'CitiesReqQueryHelper';

  private static addWarningsForValue(
    value: any,
    reqQuery: ReqQuery,
    key: string,
    downstreamKeys: string[],
    warnings: string[]
  ) {
    if (value != null) {
      for (const dKey of downstreamKeys) {
        if (reqQuery[dKey] != null) {
          warnings.push(`'${dKey}' was ignored since '${key}' took precedence`);
        }
      }
    } else {
      warnings.push(`'${key}' was invalid`);
    }
  }

  static async getCityFromId(reqQuery: ReqQuery, downstreamKeys: string[], warnings: string[]) {
    const geonameidStr = reqQuery[API_GEONAMEID_KEY];
    let city: City | undefined;

    if (typeof geonameidStr === 'string' && geonameidStr.length) {
      city = await CitiesHelper.getCityWithId(geonameidStr);
      this.addWarningsForValue(city, reqQuery, API_GEONAMEID_KEY, downstreamKeys, warnings);
    }

    return city;
  }

  static async getClosestCityFromCoordinates(reqQuery: ReqQuery, downstreamKeys: string[], warnings: string[]) {
    const coordinatesStr = reqQuery[API_COORDINATES_KEY];
    let closestCity: ClosestCity | undefined;

    if (typeof coordinatesStr === 'string' && coordinatesStr.length) {
      const coordinatesNumArr = CoordinatesHelper.strToNumArr(coordinatesStr);
      if (CoordinatesHelper.areValid(coordinatesNumArr)) {
        closestCity = await CitiesHelper.getClosestCity(coordinatesNumArr);
      }
      this.addWarningsForValue(closestCity, reqQuery, API_COORDINATES_KEY, downstreamKeys, warnings);
    }

    return closestCity;
  }

  static async getCitiesFromSearchQuery(reqQuery: ReqQuery, downstreamKeys: string[], warnings: string[]) {
    const seachQueryStr = reqQuery[API_SEARCH_QUERY_KEY];
    let cities: City[] | undefined;

    if (typeof seachQueryStr === 'string') {
      const formattedQuery = SearchQueryHelper.formatQuery(seachQueryStr);
      if (seachQueryStr !== formattedQuery) {
        warnings.push(
          `'${API_SEARCH_QUERY_KEY}' value was unformatted; it was formatted to '${formattedQuery}' for the search`
        );
      }
      cities = await CitiesHelper.searchFor(formattedQuery);
      this.addWarningsForValue(cities, reqQuery, API_SEARCH_QUERY_KEY, downstreamKeys, warnings);
    }

    return cities;
  }

  static async parseQueriedCity(reqQuery: ReqQuery) {
    const warnings: string[] = [];
    const getReturnValFor = (queriedCity: City | ClosestCity) => {
      const coordinatesNumArr = CoordinatesHelper.adjustPrecision(CoordinatesHelper.cityToNumArr(queriedCity));
      const minimalQueriedCity: MinimalQueriedCity = {
        latitude: coordinatesNumArr[0],
        longitude: coordinatesNumArr[1],
        timeZone: queriedCity.timeZone
      };
      LoggerHelper.getLogger(`${this.CLASS_NAME}.parseQueriedCity()`).verbose(
        `Using "${SearchQueryHelper.getCityAndStateCode(queriedCity)}" / ${queriedCity.geonameid}`
      );
      return {
        queriedCity,
        minimalQueriedCity,
        warnings
      };
    };

    const keys = [API_GEONAMEID_KEY, API_COORDINATES_KEY];

    const cityFromId = await CitiesReqQueryHelper.getCityFromId(reqQuery, keys.slice(1), warnings);
    if (cityFromId != null) return getReturnValFor(cityFromId);

    const closestCityFromCoordinates = await CitiesReqQueryHelper.getClosestCityFromCoordinates(reqQuery, [], warnings);
    if (closestCityFromCoordinates != null) return getReturnValFor(closestCityFromCoordinates);

    warnings.push(`No valid query param was provided; valid keys are: '${keys.join(`', '`)}'`);
    warnings.push(`Returned data is for the default city of '${SearchQueryHelper.getCityAndStateCode(DEFAULT_CITY)}'`);
    return getReturnValFor(DEFAULT_CITY);
  }
}
