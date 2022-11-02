export interface FullCity {
  cityAndStateCode: string;
  cityName: string;
  alternateCityNames: string[];
  stateCode: string;
  population: number;
  latitude: number;
  longitude: number;
  timeZone: string;
  geonameid: number;
  modified: string;
}

export interface InputCity extends Omit<FullCity, 'cityAndStateCode'> {}

export interface City extends Pick<FullCity, 'cityName' | 'stateCode' | 'latitude' | 'longitude' | 'timeZone'> {}

export type CitiesQueryCache = Record<string, number[]>;
