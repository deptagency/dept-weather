export type CurrentObservations = Array<CurrentObservation>;

export interface CurrentObservation {
  DateObserved: string;
  HourObserved: number;
  LocalTimeZone: string;
  ReportingArea: string;
  StateCode: string;
  Latitude: number;
  Longitude: number;
  ParameterName: PollutantType | string;
  AQI: number;
  Category: AQILevel;
}

export interface AQILevel {
  Number: number;
  Name: AQILevelName;
}

export enum AQILevelName {
  GOOD = 'Good',
  MODERATE = 'Moderate',
  UNHEALTHY_FOR_SENSITIVE = 'Unhealthy for Sensitive Groups',
  UNHEALTHY = 'Unhealthy',
  VERY_UNHEALTHY = 'Very Unhealthy',
  HAZARDOUS = 'Hazardous',
  UNAVAILABLE = 'Unavailable'
}

export enum PollutantType {
  O3 = 'O3',
  PM2_5 = 'PM2.5',
  PM10 = 'PM10'
}
