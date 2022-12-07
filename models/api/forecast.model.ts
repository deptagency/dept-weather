import { DataSource, DetailedWindDirection, WindDirection } from 'models';
import { Wind } from './observations.model';
import { QueriedCityInfo } from './queried-location-info.model';
import { BaseData } from './response.model';

export interface Forecast extends QueriedCityInfo {
  [DataSource.NATIONAL_WEATHER_SERVICE]?: NwsForecast;
}

export interface NwsForecast extends BaseData {
  forecasts: Array<NwsForecastPeriod>;
}

export interface NwsForecastPeriod {
  dayName: string | null;
  shortDateName: string | null;
  periodStart: number | null;
  periodEnd: number | null;
  isDaytime: boolean | null;
  temperature: number | null;
  wind: WindForecast;
  shortForecast: string | null;
  detailedForecast: string | null;
}

export interface WindForecast extends Omit<Wind, 'directionDeg'> {
  minSpeed: number | null;
  maxSpeed: number | null;
  minGustSpeed: number | null;
  maxGustSpeed: number | null;
  direction: WindDirection | DetailedWindDirection | null;
}
