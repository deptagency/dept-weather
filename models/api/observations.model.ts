import { AQILevelName } from 'models/airnow/current-observations';
import { QueriedCityInfo } from 'models/api/queried-location-info.model';
import { BaseData } from 'models/api/response.model';
import { DataSource } from 'models/data-source.enum';
import { SunriseSunset } from 'models/sunrise-sunset/sunrise-sunset';

export interface Observations extends QueriedCityInfo {
  [DataSource.WEATHERLINK]?: WlObservations;
  [DataSource.NATIONAL_WEATHER_SERVICE]?: NwsObservations;
  [DataSource.AIRNOW]?: AirNowObservations;
  [DataSource.ENVIRONMENTAL_PROTECTION_AGENCY]?: EpaHourlyForecast;
  [DataSource.SUN_TIMES]?: SunTimesObservations;
}

export interface WeatherObservations extends BaseData {
  temperature: number | null;
  feelsLike: number | null;
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
  pressure: WlPressure;
  rainfall: WlPrecipitation;
}

export interface AirNowObservations extends BaseData {
  observations: Array<AirNowObservation>;
}

export interface EpaHourlyForecast extends BaseData {
  hourlyForecast: Array<EpaHourlyForecastItem>;
}

export interface SunTimesObservations extends BaseData, SunriseSunset {}

export interface Wind {
  speed: number | null;
  directionDeg: number | null;
  gustSpeed: number | null;
}

export type PressureLevelDescription = 'low' | 'medium' | 'high';
export type PressureTrendDescription = 'decreasing' | 'stable' | 'increasing';

export interface BasePressure {
  atSeaLevel: number | null;
  atSeaLevelDescription: PressureLevelDescription | null;
}

export interface WlPressure extends BasePressure {
  trend: number | null;
  trendDescription: PressureTrendDescription | null;
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
