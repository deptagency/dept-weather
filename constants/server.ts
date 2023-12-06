import { DEFAULT_UNITS } from 'constants/shared';
import { LogLevel } from 'models/api/logger.model';
import { Unit, UnitType } from 'models/unit.enum';

export const AQ_COORDINATES_STR = '42.35826159869919,-71.05360507074275';

export const CITY_SEARCH_DISTANCE_TO_QUERIED_ROUNDING_LEVEL = 2;
export const CITY_SEARCH_RESULTS_MAX_AGE = 90 * 24 * 60 * 60; // 90 days;
export const CITY_SEARCH_DATA_FOLDER = './data';
export const CITY_SEARCH_CITIES_BY_ID_FILENAME = 'cities-by-id.json';
export const CITY_SEARCH_QUERY_CACHE_FILENAME = 'cities-top30556-query-cache.json';

export const NWS_RECORDING_INTERVAL = 1 * 60 * 60; // 1 hour
export const AIRNOW_RECORDING_INTERVAL = 1 * 60 * 60; // 1 hour

export const FEELS_UNITS: Record<UnitType, Unit> = {
  ...DEFAULT_UNITS,
  [UnitType.temp]: Unit.C,
  [UnitType.wind]: Unit.METERS
};

export const PUSH_UUID_V1_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const PUSH_URL_REGEX =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;
export const PUSH_RESP_JSON_CONTENT_HEADERS: HeadersInit = { 'content-type': 'application/json' };

export const API_ROUTE_PATH = '/api';

export const LOG_TIMESTAMP_FORMAT = 'HH:mm:ss.SSS';
export const MIN_LOG_LEVEL_DEV: LogLevel = LogLevel.log;
export const MIN_LOG_LEVEL_PROD: LogLevel = LogLevel.log;
