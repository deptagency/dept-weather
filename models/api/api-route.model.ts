import { API_ROUTE_PATH } from '../../constants';

export enum APIRoute {
  CITY_SEARCH = 'city-search',
  CURRENT = 'current',
  FORECAST = 'forecast',
  HEALTH = 'health'
}

export type QueryParams = Record<string, string | number> | undefined;

export const getPath = (route: APIRoute, queryParams?: QueryParams) => {
  let path = `${API_ROUTE_PATH}/${route}`;
  if (queryParams != null && Object.keys(queryParams).length > 0) {
    const formattedQueryParams = Object.keys(queryParams).map(key => `${key}=${queryParams[key]}`);
    path += `?${formattedQueryParams.join('&')}`;
  }
  return path;
};
