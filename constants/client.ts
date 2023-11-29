import { SearchResultCity } from 'models/cities/cities.model';
import { AppTheme } from 'models/color.enum';

export const APP_TITLE = 'DEPT® Weather';
export const APP_DESCRIPTION = `The ${APP_TITLE} app provides up-to-date weather observations, daily & hourly forecasts, and alerts for locations across the U.S.`;
export const APP_URL = 'https://weather.deptagency.com';
export const APP_MASK_ICON_COLOR = '#000';
export const CITIES_CACHE_FILENAME = 'cities-top10000-bundled-cache.json';
export const UI_ANIMATION_DURATION = 300;
export const GEOPOSITION_PERMISSION_DENIED_ERROR_CODE = 1;

export const CURRENT_LOCATION: SearchResultCity = {
  cityAndStateCode: 'Current Location',
  geonameid: '0'
} as SearchResultCity;

export const CITY_SEARCH_DEBOUNCE_MS = 250;

export enum LocalStorageKey {
  RECENT_CITIES = 'recentCities',
  UUID = 'uuid',
  APP_THEME = 'appTheme',
  UNITS = 'units'
}

export const DEFAULT_APP_THEME: AppTheme = 'system';
export const COLOR_SCHEME_REGEX = /light|dark/g;

export const IME_UNSETTLED_KEY_CODE = '229';

export const QUERY_EXPANDED_ALERT_ID_KEY = 'alertId';
