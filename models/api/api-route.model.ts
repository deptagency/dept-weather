import { API_ROUTE_PATH } from '../../constants';

export enum APIRoute {
  CURRENT = 'current',
  HEALTH = 'health'
}

export const getPath = (route: APIRoute) => `${API_ROUTE_PATH}/${route}`;
