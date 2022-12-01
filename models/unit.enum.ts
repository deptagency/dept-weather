export enum Unit {
  F = 'f',
  C = 'c',
  KM = 'km',
  METERS = 'm',
  MILLIMETERS = 'mm',
  MILES = 'miles',
  INCHES = 'in',
  PASCAL = 'pa',
  MILLIBAR = 'mb'
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

// These variables are the conversion factors, sourced from https://www.convertunits.com/
//  X_Y means "number of x in 1 y"
//  X → Y = xVal * X_Y
//  Y → X = yVal / X_Y

// DISTANCE
const KM_M = 1_000;
const M_MM = 1_000;
const KM_MM = KM_M * M_MM;
const KM_IN = 39370.078740157;

const M_IN = KM_IN / KM_M; // 39.370078740157
const MM_IN = KM_IN / KM_MM; // 0.039370078740157

const MI_KM = 1.609344;
const MI_M = KM_M * MI_KM; // 1,609.344
const MI_MM = KM_MM * MI_KM; // 1,609,344
const MI_IN = MI_KM / KM_IN; // 63,360

// PRESSURE
const MB_PA = 100;

const MMHG_MB = 1.3332239;
const MMHG_PA = MMHG_MB * MB_PA; // 133.32239

const INHG_MB = 33.863886666667;
const INHG_PA = INHG_MB * MB_PA; // 3,386.3886666667

export const CONVERSION_FACTORS = {
  [Unit.KM]: {
    [Unit.METERS]: KM_M,
    [Unit.MILLIMETERS]: KM_MM,
    [Unit.INCHES]: KM_IN
  },
  [Unit.METERS]: {
    [Unit.MILLIMETERS]: M_MM,
    [Unit.INCHES]: M_IN
  },
  [Unit.MILLIMETERS]: {
    [Unit.PASCAL]: MMHG_PA,
    [Unit.MILLIBAR]: MMHG_MB,
    [Unit.INCHES]: MM_IN
  },
  [Unit.MILES]: {
    [Unit.KM]: MI_KM,
    [Unit.METERS]: MI_M,
    [Unit.MILLIMETERS]: MI_MM,
    [Unit.INCHES]: MI_IN
  },
  [Unit.INCHES]: {
    [Unit.PASCAL]: INHG_PA,
    [Unit.MILLIBAR]: INHG_MB
  },
  [Unit.MILLIBAR]: {
    [Unit.PASCAL]: MB_PA
  }
} as Partial<Record<Unit, Partial<Record<Unit, number>>>>;
