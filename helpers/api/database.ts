import { Kysely } from 'kysely';
import { PlanetScaleDialect } from 'kysely-planetscale';
import { FullCity } from 'models/cities/cities.model';

export interface Database {
  cities: Omit<FullCity, 'geonameid'> & {
    geonameid: number;
    forecastZone: string | null;
    countyZone: string | null;
    fireZone: string | null;
    zonesLastUpdated: string | null;
  };
  pushSubscriptions: {
    id: string;
    endpoint: string | null;
    expirationTime: Date | null;
    keyP256dh: string | null;
    keyAuth: string | null;
    unSubscribedAt: Date | null;
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
