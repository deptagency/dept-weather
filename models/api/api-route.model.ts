import { API_ROUTE_PATH } from '../../constants';

export enum APIRoute {
  CURRENT = 'current',
  FORECAST = 'forecast',
  HEALTH = 'health'
}

export const getPath = (route: APIRoute) => `${API_ROUTE_PATH}/${route}`;
