import { DEFAULT_UNITS } from 'constants/shared';
import { Unit, UnitType } from 'models/unit.enum';

export const AQ_COORDINATES_STR = '42.35826159869919,-71.05360507074275';

export const CITY_SEARCH_DISTANCE_TO_QUERIED_ROUNDING_LEVEL = 2;
export const CITY_SEARCH_RESULTS_MAX_AGE = 90 * 24 * 60 * 60; // 90 days;
export const CITY_SEARCH_DATA_FOLDER = './data';
export const CITY_SEARCH_CITIES_BY_ID_FILENAME = 'cities-by-id.json';
export const CITY_SEARCH_QUERY_CACHE_FILENAME = 'cities-top30557-query-cache.json';

export const NWS_RECORDING_INTERVAL = 1 * 60 * 60; // 1 hour
export const AIRNOW_RECORDING_INTERVAL = 1 * 60 * 60; // 1 hour

export const FEELS_UNITS: Record<UnitType, Unit> = {
  ...DEFAULT_UNITS,
  [UnitType.temp]: Unit.C,
  [UnitType.wind]: Unit.METERS
};

export const API_ROUTE_PATH = '/api';

export const LOG_TIMESTAMP_FORMAT = 'HH:mm:ss.SSS';
export const LOG_LEVEL_STR_PADDING = 7;
export const LOG_LABEL_STR_PADDING = 22;
export const MIN_LOG_LEVEL_DEV = 'verbose';
export const MIN_LOG_LEVEL_PROD = 'verbose';
