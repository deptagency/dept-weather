import { Dispatch, SetStateAction } from 'react';
import { OverlayProps } from 'components/Header/Overlay/Overlay.types';
import { CitiesCache, SearchResultCity } from 'models/cities/cities.model';

export interface SearchOverlayProps extends Required<OverlayProps> {
  rawSearchQuery: string;
  results: SearchResultCity[];
  setResults: Dispatch<SetStateAction<SearchResultCity[]>>;
  setHighlightedIndexDistance: Dispatch<SetStateAction<number>>;
  highlightedIndex: number;
  setSelectedCity: Dispatch<SetStateAction<SearchResultCity | undefined>>;
  recentCities: SearchResultCity[];
  citiesCache: CitiesCache | undefined;
}
