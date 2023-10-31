import { API_ROUTE_PATH } from 'constants/server';

export enum APIRoute {
  ALERTS = 'alerts',
  CITY_SEARCH = 'city-search',
  CURRENT = 'current',
  FORECAST = 'forecast',
  HEALTH = 'health',
  SEND_NOTIFICATIONS = 'send-notifications'
}

export type QueryParams = Record<string, string | number> | undefined;

export const getPath = (route: APIRoute, queryParams?: QueryParams) =>
  `${API_ROUTE_PATH}/${route}${getQueryParamsStr(queryParams)}`;

export const getQueryParamsStr = (queryParams?: QueryParams) => {
  let queryParamsStr = '';
  if (queryParams != null && Object.keys(queryParams).length > 0) {
    const formattedQueryParams = Object.keys(queryParams).map(key => `${key}=${queryParams[key]}`);
    queryParamsStr += `?${formattedQueryParams.join('&')}`;
  }
  return queryParamsStr;
};
