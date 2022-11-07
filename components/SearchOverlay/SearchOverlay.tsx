import { useEffect, useRef, useState } from 'react';
import { CITY_SEARCH_DEBOUNCE_MS } from '../../constants';
import { CoordinatesHelper, QueryHelper } from '../../helpers';
import { useDebounce } from '../../hooks';
import { APIRoute, getPath } from '../../models/api';
import { City } from '../../models/cities';
import styles from './SearchOverlay.module.css';
import homeStyles from '../../styles/Home.module.css';

export default function SearchOverlay({
  showSearchOverlay,
  onShowSearchOverlayChange,
  rawSearchQuery,
  highlightedIndexDistance,
  setHighlightedIndexDistance
}: {
  showSearchOverlay: boolean;
  onShowSearchOverlayChange: (showSearchOverlay?: boolean) => void;
  rawSearchQuery: string;
  highlightedIndexDistance: number;
  setHighlightedIndexDistance: (newHID: number) => void;
}) {
  const [formattedQuery, setFormattedQuery] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [results, setResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const controllerRef = useRef<AbortController | undefined>();

  useEffect(() => {
    setFormattedQuery(QueryHelper.formatQuery(rawSearchQuery));
  }, [rawSearchQuery, formattedQuery]);

  useEffect(() => {
    if (highlightedIndexDistance >= 0) {
      setHighlightedIndex(highlightedIndexDistance % results.length);
    } else {
      const distanceFromEnd = (Math.abs(highlightedIndexDistance) - 1) % results.length;
      setHighlightedIndex(results.length - 1 - distanceFromEnd);
    }
  }, [results, highlightedIndex, highlightedIndexDistance]);

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
  }, [debouncedSearchQuery, setHighlightedIndexDistance]);

  return (
    <div
      className={`${styles.search__overlay} ${
        showSearchOverlay ? styles['search__overlay--visible'] : styles['search__overlay--hidden']
      }`}
      onClick={e => {
        if (!e.defaultPrevented) {
          onShowSearchOverlayChange(false);
        }
      }}
    >
      <div className={`${styles.search__overlay__inner} ${homeStyles['container__content--no-padding']}`}>
        {results.map((result, idx) => (
          // TODO - potential improvement - allow pressing arrow up/down here after they've tabbed in
          <button
            key={CoordinatesHelper.numArrToStr([result.latitude, result.longitude])}
            className={`${styles.search__overlay__result} ${
              idx === highlightedIndex ? styles['search__overlay__result--highlighted'] : ''
            }`}
            onFocus={() => setHighlightedIndexDistance(idx)}
            onMouseEnter={() => setHighlightedIndexDistance(idx)}
            onClick={e => e.preventDefault()}
          >{`${result.cityName}, ${result.stateCode}`}</button>
        ))}
      </div>
    </div>
  );
}
