import { AQILevelName } from '../airnow';
import { DataSource } from 'models';
import { SunriseSunset } from '../sunrise-sunset';
import { QueriedCityInfo } from './queried-location-info.model';

export interface Observations extends QueriedCityInfo {
  [DataSource.WEATHERLINK]?: WlObservations;
  [DataSource.NATIONAL_WEATHER_SERVICE]?: NwsObservations;
  [DataSource.AIRNOW]?: AirNowObservations;
  [DataSource.ENVIRONMENTAL_PROTECTION_AGENCY]?: EpaHourlyForecast;
  [DataSource.SUN_TIMES]?: SunTimesObservations;
}

export interface BaseObservations {
  readTime: number;
  validUntil: number;
}

export interface WeatherObservations extends BaseObservations {
  temperature: number | null;
  heatIndex: number | null;
  dewPoint: number | null;
  humidity: number | null;
  wind: Wind;
  pressure: BasePressure;
}

export interface NwsObservations extends WeatherObservations {
  textDescription: string | null;
  precipitation: NwsPrecipitation;
}

export interface WlObservations extends WeatherObservations {
  feelsLike: number | null;
  pressure: WlPressure;
  rainfall: WlPrecipitation;
}

export interface AirNowObservations extends BaseObservations {
  observations: Array<AirNowObservation>;
}

export interface EpaHourlyForecast extends BaseObservations {
  hourlyForecast: Array<EpaHourlyForecastItem>;
}

export interface SunTimesObservations extends BaseObservations, SunriseSunset {}

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

export interface BasePrecipitation {
  last1Hrs: number | null;
}

export interface WlPrecipitation extends BasePrecipitation {
  last15Mins: number | null;
  last24Hrs: number | null;
}
export interface NwsPrecipitation extends BasePrecipitation {
  last3Hrs: number | null;
  last6Hrs: number | null;
}

export interface AirNowObservation {
  pollutant: string | null;
  aqi: number | null;
  aqiLevelName: AQILevelName | null;
}

export interface EpaHourlyForecastItem {
  time: number;
  uvIndex: number | null;
}
