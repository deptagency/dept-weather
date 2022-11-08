import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { CITY_SEARCH_DEBOUNCE_MS } from '../../../constants';
import { CoordinatesHelper, QueryHelper } from '../../../helpers';
import { useDebounce } from '../../../hooks';
import { APIRoute, getPath } from '../../../models/api';
import { City } from '../../../models/cities';
import styles from './SearchOverlay.module.css';
import homeStyles from '../../../styles/Home.module.css';

export default function SearchOverlay({
  rawSearchQuery,
  showSearchOverlay,
  setShowSearchOverlay,
  results,
  setResults,
  setHighlightedIndexDistance,
  highlightedIndex,
  setSelectedCity
}: {
  rawSearchQuery: string;
  showSearchOverlay: boolean;
  setShowSearchOverlay: Dispatch<SetStateAction<boolean>>;
  results: City[];
  setResults: Dispatch<SetStateAction<City[]>>;
  setHighlightedIndexDistance: Dispatch<SetStateAction<number>>;
  highlightedIndex: number;
  setSelectedCity: Dispatch<SetStateAction<City>>;
}) {
  const [formattedQuery, setFormattedQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const controllerRef = useRef<AbortController | undefined>();

  useEffect(() => {
    setFormattedQuery(QueryHelper.formatQuery(rawSearchQuery));
  }, [rawSearchQuery, formattedQuery]);

  const debouncedSearchQuery: string = useDebounce<string>(formattedQuery, CITY_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const search = async (formattedQuery: string) => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        setIsSearching(true);
        const res = await fetch(`${getPath(APIRoute.CITY_SEARCH)}?query=${formattedQuery}`, {
          signal: controllerRef.current?.signal
        });
        const resJSON = await res.json();
        setResults(resJSON.data);
        setHighlightedIndexDistance(0);
        setIsSearching(false);
      } catch (e) {
        if (e instanceof Error && e?.name !== 'AbortError') {
          setResults([]);
          setIsSearching(false);
        }
      }
    };

    if (debouncedSearchQuery) {
      search(debouncedSearchQuery);
    } else {
      setResults([]);
    }
  }, [debouncedSearchQuery, setResults, setHighlightedIndexDistance]);

  return (
    <div
      className={`${styles.search__overlay} ${
        showSearchOverlay ? styles['search__overlay--visible'] : styles['search__overlay--hidden']
      }`}
      onClick={e => {
        if (!e.defaultPrevented) {
          setShowSearchOverlay(false);
        }
      }}
    >
      <div className={`${styles.search__overlay__inner} ${homeStyles['container__content--no-padding']}`}>
        {results.map((result, idx) => (
          // TODO - potential improvement - allow pressing arrow up/down here after they've tabbed in
          <button
            key={CoordinatesHelper.cityToStr(result)}
            className={`${styles.search__overlay__result} ${
              idx === highlightedIndex ? styles['search__overlay__result--highlighted'] : ''
            }`}
            onFocus={() => setHighlightedIndexDistance(idx)}
            onMouseEnter={() => setHighlightedIndexDistance(idx)}
            onClick={e => {
              e.preventDefault();
              setSelectedCity(results[highlightedIndex]);
              setShowSearchOverlay(false);
            }}
          >{`${result.cityName}, ${result.stateCode}`}</button>
        ))}
      </div>
    </div>
  );
}
