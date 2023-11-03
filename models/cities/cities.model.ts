export interface FullCity {
  cityAndStateCode: string;
  cityAndStateCodeLower: string;
  cityName: string;
  stateCode: string;
  population: number;
  latitude: number;
  longitude: number;
  timeZone: string;
  geonameid: number;
}

export interface ScoredCity extends FullCity {
  score: number;
}

export interface City
  extends Pick<FullCity, 'cityName' | 'stateCode' | 'latitude' | 'longitude' | 'timeZone' | 'geonameid'> {}

export interface InputCity extends Omit<FullCity, 'cityAndStateCode' | 'cityAndStateCodeLower'> {}

export interface ClosestCity extends City {
  distanceFromQueried: number;
}

export interface SearchResultCity
  extends Pick<FullCity, 'geonameid'>,
    Partial<Pick<FullCity, 'cityName' | 'stateCode'>>,
    Partial<Pick<FullCity, 'cityAndStateCode'>> {}

export interface MinimalQueriedCity extends CityWithCoordinates, Pick<FullCity, 'timeZone'> {}
export interface CityWithCoordinates extends Pick<FullCity, 'latitude' | 'longitude'> {}

export type CitiesQueryCache = Record<string, number[]>;
export type CitiesCityAndStateCodeCache = Record<string, string>;

export interface CitiesCache {
  queryCache: CitiesQueryCache;
  cityAndStateCodeCache: CitiesCityAndStateCodeCache;
}
