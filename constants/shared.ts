import { City } from 'models/cities/cities.model';
import { Unit, UnitType } from 'models/unit.enum';

export const MAX_COORDINATE_PRECISION = 2;

const BOSTON_CITY: City = {
  cityName: 'Boston',
  stateCode: 'MA',
  latitude: 42.35843,
  longitude: -71.05977,
  timeZone: 'America/New_York',
  geonameid: '4930956'
};
export const DEFAULT_CITY = BOSTON_CITY;

export const CITY_SEARCH_RESULT_LIMIT = 5;

export const DEFAULT_UNITS: Record<UnitType, Unit> = {
  [UnitType.temp]: Unit.F,
  [UnitType.wind]: Unit.MILES,
  [UnitType.pressure]: Unit.INCHES,
  [UnitType.precipitation]: Unit.INCHES
};

export const API_SEARCH_QUERY_KEY = 'query';
export const API_COORDINATES_KEY = 'coordinates';
export const API_GEONAMEID_KEY = 'id';
