import { Unit, UnitType } from './models';
import { City, SearchResultCity } from './models/cities';

export const APP_TITLE = 'DEPT® Weather';
export const APP_DESCRIPTION = `The ${APP_TITLE} app provides up-to-date weather information and forecasts for locations across the U.S.`;
export const APP_URL = 'https://dept-weather.vercel.app';
export const APP_THEME_COLOR = '#ffffff';
export const APP_MASK_ICON_COLOR = '#000000';
export const GID_CACHE_FILENAME = 'cities-top50-gid-cache.json';
export const SEARCH_PANEL_ANIMATION_DURATION = 300;
export const GEOPOSITION_PERMISSION_DENIED_ERROR_CODE = 1;

export const MAX_COORDINATE_PRECISION = 2;
export const AQ_COORDINATES_STR = '42.35826159869919,-71.05360507074275';

const BOSTON_CITY: City = {
  cityName: 'Boston',
  stateCode: 'MA',
  latitude: 42.35843,
  longitude: -71.05977,
  timeZone: 'America/New_York',
  geonameid: 4930956
};
export const DEFAULT_CITY = BOSTON_CITY;
export const CURRENT_LOCATION: SearchResultCity = {
  cityAndStateCode: 'Current Location',
  geonameid: 0
} as SearchResultCity;

export const CITY_SEARCH_DISTANCE_TO_QUERIED_ROUNDING_LEVEL = 2;
export const CITY_SEARCH_RESULT_LIMIT = 5;
export const CITY_SEARCH_RESULTS_MAX_AGE = 90 * 24 * 60 * 60; // 90 days;
export const CITY_SEARCH_DEBOUNCE_MS = 250;
export const CITY_SEARCH_DATA_FOLDER = './data';
export const CITY_SEARCH_CITIES_FILENAME = 'cities.json';
export const CITY_SEARCH_CITIES_BY_ID_FILENAME = 'cities-by-id.json';
export const CITY_SEARCH_QUERY_CACHE_FILENAME = 'cities-top50-query-cache.json';

export const NWS_RECORDING_INTERVAL = 1 * 60 * 60; // 1 hour
export const NWS_UPLOAD_DELAY = 27 * 60; // 27 minutes

export const AIRNOW_RECORDING_INTERVAL = 1 * 60 * 60; // 1 hour
export const AIRNOW_UPLOAD_DELAY = 70 * 60; // 70 minutes

export const DEFAULT_UNITS: Record<UnitType, Unit> = {
  [UnitType.temp]: Unit.F,
  [UnitType.wind]: Unit.MILES,
  [UnitType.pressure]: Unit.INCHES,
  [UnitType.precipitation]: Unit.INCHES
};

export const API_ROUTE_PATH = '/api';
export const API_SEARCH_QUERY_KEY = 'query';
export const API_COORDINATES_KEY = 'coordinates';
export const API_GEONAMEID_KEY = 'id';

export const LOCAL_STORAGE_RECENT_CITIES_KEY = 'recentCities';

export const IME_UNSETTLED_KEY_CODE = '229';

export const LOG_TIMESTAMP_FORMAT = 'YY-MM-DD HH:mm:ss';
export const LOG_LEVEL_STR_PADDING = 7;
export const LOG_LABEL_STR_PADDING = 22;
export const MIN_LOG_LEVEL_DEV = 'verbose';
export const MIN_LOG_LEVEL_PROD = 'debug';
