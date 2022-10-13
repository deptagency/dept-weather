import { Geometry } from './geometry.model';
import { QuantitativeValue } from './quantitative-value.model';

export interface StationsResponse {
  id: string;
  geometry: Geometry;
  properties: Stations;
}

export interface Stations {
  elevation: QuantitativeValue;
  stationIdentifier: string;
  name: string;
  timeZone: string;
  forecast: string;
  county: string;
  fireWeatherZone: string;
}
