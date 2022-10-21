import { Coordinates, Unit, UnitType } from './models';

export const MAX_COORDINATE_PRECISION = 4;
export const AQ_COORDINATES: Coordinates = {
  latitude: 42.35826159869919,
  longitude: -71.05360507074275
};

export const NWS_RECORDING_INTERVAL = 1 * 60 * 60; // 1 hour
export const NWS_UPLOAD_DELAY = 25 * 60; // 25 minutes

export const AIRNOW_RECORDING_INTERVAL = 1 * 60 * 60; // 1 hour
export const AIRNOW_UPLOAD_DELAY = 30 * 60; // 30 minutes

export const DEFAULT_UNITS: Record<UnitType, Unit> = {
  [UnitType.temp]: Unit.F,
  [UnitType.wind]: Unit.MILES,
  [UnitType.pressure]: Unit.INCHES,
  [UnitType.precipitation]: Unit.INCHES
};

export const API_ROUTE_PATH = '/api';
