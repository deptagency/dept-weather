import { API_COORDINATES_KEY, API_GEONAMEID_KEY, API_SEARCH_QUERY_KEY } from '@constants';
import { CoordinatesHelper, SearchQueryHelper } from 'helpers';
import { ReqQuery } from 'models/api';
import { City, ClosestCity } from 'models/cities';
import { CitiesHelper } from './cities-helper';

export class CitiesReqQueryHelper {
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
}
