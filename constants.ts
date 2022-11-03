import Fuse from 'fuse.js';
import { Unit, UnitType } from './models';
import { FullCity } from './models/cities';

export const MAX_COORDINATE_PRECISION = 2;
export const AQ_COORDINATES_STR = '42.35826159869919,-71.05360507074275';

export const CITY_SEARCH_RESULT_LIMIT = 5;
export const CITY_SEARCH_POPULATION_SORT_THRESHOLD = 10e-4;
export const CITY_SEARCH_RESULTS_MAX_AGE = 90 * 24 * 60 * 60; // 90 days;
export const CITY_SEARCH_FUSE_OPTIONS: Fuse.IFuseOptions<FullCity> = {
  includeScore: true,
  keys: [
    { name: 'cityAndStateCode', weight: 0.9 },
    { name: 'alternateCityNames', weight: 0.1 }
  ]
};
export const CITY_SEARCH_DEBOUNCE_MS = 250;
export const CITY_SEARCH_INDEX_FILENAME = 'cities-index.json';
export const CITY_SEARCH_QUERY_CACHE_FILENAME = 'cities-top500-query-cache.json';

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
