import { Unit, UnitType } from './models';

export const MAX_COORDINATE_PRECISION = 4;
export const AQ_COORDINATES_STR = '42.35826159869919,-71.05360507074275';

export const NWS_RECORDING_INTERVAL = 1 * 60 * 60; // 1 hour
export const NWS_UPLOAD_DELAY = 25 * 60; // 25 minutes

export const AIRNOW_RECORDING_INTERVAL = 1 * 60 * 60; // 1 hour
export const AIRNOW_UPLOAD_DELAY = 70 * 60; // 70 minutes

// TODO - determine correct value
export const EPA_REPORTING_INTERVAL = 24 * 60 * 60; // 24 hours

export const DEFAULT_UNITS: Record<UnitType, Unit> = {
  [UnitType.temp]: Unit.F,
  [UnitType.wind]: Unit.MILES,
  [UnitType.pressure]: Unit.INCHES,
  [UnitType.precipitation]: Unit.INCHES
};

export const API_ROUTE_PATH = '/api';
