import { DataSource } from '../data-source.enum';

export interface Observations {
  [DataSource.WEATHERLINK]?: WlObservations;
  [DataSource.NATIONAL_WEATHER_SERVICE]?: NwsObservations;
}

export interface BaseObservations {
  readTime: number;
  validUntil: number;
  temperature: number | null;
  heatIndex: number | null;
  dewPoint: number | null;
  humidity: number | null;
  wind: Wind;
  pressure: BasePressure;
}

export interface NwsObservations extends BaseObservations {
  textDescription: string | null;
}

export interface WlObservations extends BaseObservations {
  feelsLike: number | null;
  pressure: WlPressure;
}

export interface Wind {
  speed: number | null;
  direction: number | null;
  gustSpeed: number | null;
}

export interface BasePressure {
  atSeaLevel: number | null;
}

export interface WlPressure extends BasePressure {
  trend: number | null;
}
