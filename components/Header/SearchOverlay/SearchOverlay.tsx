import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { API_SEARCH_QUERY_KEY, CITY_SEARCH_DEBOUNCE_MS } from '../../../constants';
import { CoordinatesHelper, QueryHelper } from '../../../helpers';
import { useDebounce } from '../../../hooks';
import { APIRoute, getPath } from '../../../models/api';
import { City } from '../../../models/cities';
import styles from './SearchOverlay.module.css';
import homeStyles from '../../../styles/Home.module.css';

const RecentIcon = ({ isHidden }: { isHidden: boolean }) => (
  <svg
    className={`${styles['search__overlay__result__recent-icon']} ${
      isHidden ? styles['search__overlay__result__recent-icon--hidden'] : ''
    }`}
    aria-label="Recent City"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M9 15.1667C8.724 15.1667 8.5 14.9427 8.5 14.6667C8.5 14.3907 8.724 14.1667 9 14.1667C12.3087 14.1667 15 11.4753 15 8.16666C15 4.858 12.3087 2.16666 9 2.16666C5.97 2.16666 3.42733 4.46333 3.05 7.40733L4.14667 6.31133C4.24133 6.21666 4.36667 6.16466 4.5 6.16466C4.63333 6.16466 4.75933 6.21666 4.85333 6.31133C4.948 6.40533 5 6.53133 5 6.66466C5 6.798 4.948 6.924 4.85333 7.018L2.86267 9.00866C2.778 9.10533 2.642 9.16666 2.5 9.16666C2.358 9.16666 2.222 9.10533 2.12667 8.998L0.146667 7.018C0.052 6.924 0 6.798 0 6.66466C0 6.53133 0.052 6.40533 0.146667 6.31133C0.240667 6.21666 0.366667 6.16466 0.5 6.16466C0.633333 6.16466 0.759333 6.21666 0.853333 6.31133L2.034 7.492C2.37733 3.95533 5.39 1.16666 9 1.16666C12.86 1.16666 16 4.30666 16 8.16666C16 12.0267 12.86 15.1667 9 15.1667Z" />
    <path d="M8.5 9.16467C8.224 9.16467 8 8.94067 8 8.66467V4.16467C8 3.88867 8.224 3.66467 8.5 3.66467C8.776 3.66467 9 3.88867 9 4.16467V8.16467H12C12.276 8.16467 12.5 8.38867 12.5 8.66467C12.5 8.94067 12.276 9.16467 12 9.16467H8.5Z" />
  </svg>
);

export default function SearchOverlay({
  rawSearchQuery,
  showSearchOverlay,
  setShowSearchOverlay,
  results,
  setResults,
  setHighlightedIndexDistance,
  highlightedIndex,
  setSelectedCity,
  recentCities
}: {
  rawSearchQuery: string;
  showSearchOverlay: boolean;
  setShowSearchOverlay: Dispatch<SetStateAction<boolean>>;
  results: City[];
  setResults: Dispatch<SetStateAction<City[]>>;
  setHighlightedIndexDistance: Dispatch<SetStateAction<number>>;
  highlightedIndex: number;
  setSelectedCity: Dispatch<SetStateAction<City | undefined>>;
  recentCities: City[];
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
        const res = await fetch(getPath(APIRoute.CITY_SEARCH, { [API_SEARCH_QUERY_KEY]: formattedQuery }), {
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
    } else if (debouncedSearchQuery != null) {
      setResults(recentCities);
    } else {
      setResults([]);
    }
  }, [debouncedSearchQuery, recentCities, setResults, setHighlightedIndexDistance]);

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
        <ul id="SearchResultsList" className={styles['search__overlay__results-list']} role="listbox">
          {results.map((result, idx) => (
            <li
              id={`SearchResult${idx}`}
              key={CoordinatesHelper.cityToStr(result)}
              className={`${styles.search__overlay__result} ${
                idx === highlightedIndex ? styles['search__overlay__result--highlighted'] : ''
              }`}
              role="option"
              aria-selected={idx === highlightedIndex}
              onFocus={() => setHighlightedIndexDistance(idx)}
              onTouchStart={() => setHighlightedIndexDistance(idx)}
              onMouseEnter={() => setHighlightedIndexDistance(idx)}
              onClick={e => {
                e.preventDefault();
                setSelectedCity(results[highlightedIndex]);
                setShowSearchOverlay(false);
              }}
            >
              <span>{`${result.cityName}, ${result.stateCode}`}</span>
              <RecentIcon
                isHidden={!recentCities.find(recentCity => recentCity.geonameid === result.geonameid)}
              ></RecentIcon>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
