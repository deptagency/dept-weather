import { Kysely } from 'kysely';
import { PlanetScaleDialect } from 'kysely-planetscale';
import { FullCity } from 'models/cities/cities.model';

export interface Database {
  cities: Omit<FullCity, 'geonameid'> & {
    geonameid: number;
    forecastZone?: string;
    countyZone?: string;
    fireZone?: string;
    zonesLastUpdated?: string;
  };
  pushSubscriptions: {
    id: string;
    endpoint?: string;
    expirationTime?: Date;
    keyP256dh?: string;
    keyAuth?: string;
    unSubscribedAt?: Date;
  };
  alertCitySubscriptions: {
    id: number;
    userId: string;
    geonameid: number;
  };
  alertsPushHistory: {
    alertId: string;
  };
}

export const db = new Kysely<Database>({
  dialect: new PlanetScaleDialect({
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD
  })
});
