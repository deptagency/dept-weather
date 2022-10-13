import { Geometry } from './geometry.model';
import { QuantitativeValue } from './quantitative-value.model';

export interface PointResponse {
  id: string;
  properties: Point;
}

export interface Point {
  geometry: Geometry;
  cwa: string;
  forecastOffice: string;
  gridId: string;
  gridX: number;
  gridY: number;
  forecast: string;
  forecastHourly: string;
  forecastGridData: string;
  observationStations: string;
  relativeLocation: RelativeLocationResponse;
  forecastZone: string;
  county: string;
  fireWeatherZone: string;
  timeZone: string;
  radarStation: string;
}

export interface RelativeLocationResponse {
  id: string;
  geometry: Geometry;
  properties: RelativeLocation;
}

export interface RelativeLocation {
  city: string;
  state: string;
  distance: QuantitativeValue;
  bearing: QuantitativeValue;
}
