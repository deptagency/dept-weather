import { Unit, UnitType } from './models';
import { StationsResponse } from './models/nws';

export const AQ_LATITUDE = 42.35826159869919;
export const AQ_LONGITUDE = -71.05360507074275;

export const NWS_FALLBACK_STATION: StationsResponse = {
  id: 'https://api.weather.gov/stations/KBOS',
  geometry: { coordinates: [-71.01056, 42.36056] },
  properties: {
    elevation: { unitCode: 'wmoUnit:m', value: 6.096 },
    stationIdentifier: 'KBOS',
    name: 'Boston, Logan International Airport',
    timeZone: 'America/New_York',
    forecast: 'https://api.weather.gov/zones/forecast/MAZ015',
    county: 'https://api.weather.gov/zones/county/MAC025',
    fireWeatherZone: 'https://api.weather.gov/zones/fire/MAZ015'
  }
};
export const NWS_RECORDING_INTERVAL = 1 * 60 * 60; // 1 hour
export const NWS_UPLOAD_DELAY = 20 * 60; // 20 minutes

export const DEFAULT_UNITS: Record<UnitType, Unit> = {
  [UnitType.temp]: Unit.F,
  [UnitType.distance]: Unit.MILES,
  [UnitType.pressure]: Unit.INCHES_OF_MERCURY
};
