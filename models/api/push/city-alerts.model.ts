import { Database } from 'helpers/api/database';
import { SubscribeRequest } from 'models/api/push/subscribe.model';
import { City } from 'models/cities/cities.model';

export type CityAlertsRequest = Required<Pick<SubscribeRequest, 'uuid'>> & Pick<City, 'geonameid'>;

export type CityAlertsResponse = (Omit<City, 'geonameid'> & Pick<Database['cities'], 'geonameid'>)[];
