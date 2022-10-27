import { Geometry } from './geometry.model';
import { QuantitativeValue } from './quantitative-value.model';

export interface PointsResponse {
  id: string;
  geometry: Geometry;
  properties: Points;
}

export interface Points {
  cwa: string;
  forecastOffice: string;
  gridId: string;
  gridX: number;
  gridY: number;
  forecast: string;
  forecastHourly: string;
  forecastGridData: string;
  observationStations: string;
  relativeLocation: RelativeLocation;
  forecastZone: string;
  county: string;
  fireWeatherZone: string;
  timeZone: string;
  radarStation: string;
}

export interface RelativeLocation {
  type: string;
  geometry: Geometry;
  properties: RelativeLocationProperties;
}

export interface RelativeLocationProperties {
  city: string;
  state: string;
  distance: QuantitativeValue;
  bearing: QuantitativeValue;
}
