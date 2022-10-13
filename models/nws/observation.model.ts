import { CloudLayer } from './cloud-layer.model';
import { Geometry } from './geometry.model';
import { MetarPhenomenon } from './metar-phenomenon.model';
import { QuantitativeValue } from './quantitative-value.model';

export interface ObservationResponse {
  id: string;
  geometry: Geometry;
  properties: Observation;
}

export interface Observation {
  elevation: QuantitativeValue;
  station: string;
  timestamp: string;
  rawMessage: string;
  textDescription: string;
  presentWeather: Array<MetarPhenomenon>;
  temperature: QuantitativeValue;
  dewpoint: QuantitativeValue;
  windDirection: QuantitativeValue;
  windSpeed: QuantitativeValue;
  windGust: QuantitativeValue;
  Measurement: QuantitativeValue;
  barometricPressure: QuantitativeValue;
  seaLevelPressure: QuantitativeValue;
  visibility: QuantitativeValue;
  maxTemperatureLast24Hours: QuantitativeValue;
  minTemperatureLast24Hours: QuantitativeValue;
  precipitationLastHour: QuantitativeValue;
  precipitationLast3Hours: QuantitativeValue;
  precipitationLast6Hours: QuantitativeValue;
  relativeHumidity: QuantitativeValue;
  windChill: QuantitativeValue;
  heatIndex: QuantitativeValue;
  cloudLayers: CloudLayer[];
}
