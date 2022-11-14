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

export interface City
  extends Pick<FullCity, 'cityName' | 'stateCode' | 'latitude' | 'longitude' | 'timeZone' | 'geonameid'> {}

export interface InputCityById extends Omit<City, 'geonameid' | 'cityAndStateCode'> {}

export interface QueriedLocation extends QueriedCoordinates, Pick<FullCity, 'timeZone'> {}

export interface QueriedCoordinates extends Pick<FullCity, 'latitude' | 'longitude'> {}

export type CitiesById = Record<string, InputCityById>;

export type CitiesQueryCache = Record<string, number[]>;
