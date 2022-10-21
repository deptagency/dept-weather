export enum Unit {
  F = 'f',
  C = 'c',
  KM = 'km',
  MILES = 'miles',
  PASCAL = 'pa',
  MILLIBAR = 'mb',
  INCHES = 'in',
  METERS = 'm',
  MILLIMETERS = 'mm'
}

export enum UnitType {
  temp = 'temp',
  wind = 'wind',
  pressure = 'pressure',
  precipitation = 'precipitation'
}

export interface UnitMapping {
  from: Unit;
  to: Unit;
}

export type Units = Record<UnitType, UnitMapping>;
