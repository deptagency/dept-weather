import { Database } from 'helpers/api/database';
import { City } from 'models/cities/cities.model';

export type CityAlertsResponse = (Omit<City, 'geonameid'> & Pick<Database['cities'], 'geonameid'>)[];
