import { Geometry } from './geometry.model';
import { QuantitativeValue } from './quantitative-value.model';

export interface StationsResponse {
  features: Array<Feature>;
  observationStations: string[];
}

export interface Feature {
  id: string;
  geometry: Geometry;
  properties: Station;
}

export interface Station {
  elevation: QuantitativeValue;
  stationIdentifier: string;
  name: string;
  timeZone: string;
  forecast: string;
  county: string;
  fireWeatherZone: string;
}
