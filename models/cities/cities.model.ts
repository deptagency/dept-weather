export interface FullCity {
  cityAndStateCode: string;
  cityAndStateCodeLower: string;
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
export interface ScoredCity extends FullCity {
  score: number;
}

export interface City
  extends Pick<FullCity, 'cityName' | 'stateCode' | 'latitude' | 'longitude' | 'timeZone' | 'geonameid'> {}

export interface ClosestCity extends City {
  distanceFromQueried: number;
}

export interface SearchResultCity
  extends Pick<FullCity, 'geonameid'>,
    Partial<Pick<FullCity, 'cityName' | 'stateCode'>>,
    Partial<Pick<FullCity, 'cityAndStateCode'>> {}

export interface InputCityById extends Omit<City, 'geonameid' | 'cityAndStateCode'> {}

export interface MinimalQueriedCity extends CityWithCoordinates, Pick<FullCity, 'timeZone'> {}
export interface CityWithCoordinates extends Pick<FullCity, 'latitude' | 'longitude'> {}

export type CitiesById = Record<string, InputCityById>;

export type CitiesQueryCache = Record<string, number[]>;
export type CitiesCityAndStateCodeCache = Record<string, string>;

export interface CitiesGIDCache {
  gidQueryCache: CitiesQueryCache;
  gidCityAndStateCodeCache: CitiesCityAndStateCodeCache;
}
