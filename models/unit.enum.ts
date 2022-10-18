export enum Unit {
  F = 'f',
  C = 'c',
  KM = 'km',
  MILES = 'miles',
  PASCAL = 'pa',
  INCHES_OF_MERCURY = 'in',
  MILLIBAR = 'mb'
}

export enum UnitType {
  temp = 'temp',
  distance = 'distance',
  pressure = 'pressure'
}

export interface UnitMapping {
  from: Unit;
  to: Unit;
}

export type Units = Record<UnitType, UnitMapping>;
