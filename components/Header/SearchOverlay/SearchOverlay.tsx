import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { CITY_SEARCH_DEBOUNCE_MS, CURRENT_LOCATION } from 'constants/client';
import { API_SEARCH_QUERY_KEY, CITY_SEARCH_RESULT_LIMIT } from 'constants/shared';
import { LocateIcon, RecentIcon } from 'components/Icons';
import { SearchQueryHelper } from 'helpers';
import { useDebounce } from 'hooks';
import { APIRoute, getPath } from 'models/api';
import { CitiesGIDCache, SearchResultCity } from 'models/cities';
import homeStyles from 'styles/Home.module.css';
import styles from './SearchOverlay.module.css';

export default function SearchOverlay({
  rawSearchQuery,
  showSearchOverlay,
  setShowSearchOverlay,
  results,
  setResults,
  setHighlightedIndexDistance,
  highlightedIndex,
  setSelectedCity,
  recentCities,
  citiesGIDCache
}: {
  rawSearchQuery: string;
  showSearchOverlay: boolean;
  setShowSearchOverlay: Dispatch<SetStateAction<boolean>>;
  results: SearchResultCity[];
  setResults: Dispatch<SetStateAction<SearchResultCity[]>>;
  setHighlightedIndexDistance: Dispatch<SetStateAction<number>>;
  highlightedIndex: number;
  setSelectedCity: Dispatch<SetStateAction<SearchResultCity | undefined>>;
  recentCities: SearchResultCity[];
  citiesGIDCache: CitiesGIDCache | undefined;
}) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery: string = useDebounce<string>(searchQuery, CITY_SEARCH_DEBOUNCE_MS);
  const controllerRef = useRef<AbortController | undefined>();

  const findInRecentCities = useCallback(
    (city: SearchResultCity) => recentCities.find(recentCity => recentCity.geonameid === city.geonameid),
    [recentCities]
  );
  const sortRecentsToFront = useCallback(
    (a: SearchResultCity, b: SearchResultCity) =>
      Number(findInRecentCities(b) != null) - Number(findInRecentCities(a) != null),
    [findInRecentCities]
  );

  useEffect(() => {
    const abortSearchCallAndUse = (newResults: SearchResultCity[]) => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const sortedNewResults = [...newResults].sort(sortRecentsToFront);
      setResults(sortedNewResults);
      setHighlightedIndexDistance(0);
      setSearchQuery('');
    };

    const formattedQuery = SearchQueryHelper.formatQuery(rawSearchQuery);
    // If query is non-empty string & cache is defined...
    if (formattedQuery && citiesGIDCache != null) {
      const cachedQuery = citiesGIDCache.gidQueryCache[formattedQuery.toLowerCase()];
      // If query is in gidQueryCache...
      if (cachedQuery?.length) {
        // Map array of geonameids to array of objects, which also include the cityAndStateCode found in the gidCityAndStateCodeCache
        const cachedResults = cachedQuery.map(geonameid => ({
          cityAndStateCode: citiesGIDCache.gidCityAndStateCodeCache[String(geonameid)],
          geonameid: String(geonameid)
        }));
        abortSearchCallAndUse(cachedResults);
        return;
      }
    }
    // Else if query is empty string, use recentCities
    else if (formattedQuery === '') {
      const slicedRecentCities = recentCities.slice(0, CITY_SEARCH_RESULT_LIMIT);
      abortSearchCallAndUse(
        slicedRecentCities.find(recentCity => recentCity?.geonameid === CURRENT_LOCATION.geonameid) ||
          !('geolocation' in navigator)
          ? slicedRecentCities
          : [...slicedRecentCities, CURRENT_LOCATION]
      );
      return;
    }

    const getCachedResponseElseDebounce = async () => {
      try {
        const cachedResponse = await caches.match(
          getPath(APIRoute.CITY_SEARCH, { [API_SEARCH_QUERY_KEY]: formattedQuery })
        );
        if (cachedResponse) {
          // API call was previously made & cached, use the cached response
          const cachedResJSON = await cachedResponse.json();
          abortSearchCallAndUse(cachedResJSON.data);
          return;
        }
      } catch {}

      // Debounce a new /city-search API call
      setSearchQuery(formattedQuery);
    };
    getCachedResponseElseDebounce();
  }, [rawSearchQuery, recentCities, citiesGIDCache, sortRecentsToFront, setResults, setHighlightedIndexDistance]);

  useEffect(() => {
    const search = async (searchQuery: string) => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const res = await fetch(getPath(APIRoute.CITY_SEARCH, { [API_SEARCH_QUERY_KEY]: searchQuery }), {
          signal: controllerRef.current?.signal
        });
        const resJSON = await res.json();
        setResults([...resJSON.data].sort(sortRecentsToFront));
        setHighlightedIndexDistance(0);
      } catch (e) {
        if (e instanceof Error && e?.name !== 'AbortError') {
          setResults([]);
        }
      }
    };

    if (debouncedSearchQuery) {
      search(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, sortRecentsToFront, setResults, setHighlightedIndexDistance]);

  return (
    <div
      className={`animated ${styles['search-overlay']} ${
        showSearchOverlay ? styles['search-overlay--visible'] : styles['search-overlay--hidden']
      }`}
      onClick={e => {
        if (!e.defaultPrevented) {
          setShowSearchOverlay(false);
        }
      }}
    >
      <div className={`${styles['search-overlay__inner']} ${homeStyles['container__content--no-padding']}`}>
        <ul id="SearchResultsList" className={styles['search-overlay__results-list']} role="listbox">
          {results.map((result, idx) => {
            const cityAndStateCode = SearchQueryHelper.getCityAndStateCode(result);
            const isCurrentLocation = result?.geonameid === CURRENT_LOCATION.geonameid;
            const resultIdxInRecent = recentCities.findIndex(recentCity => recentCity.geonameid === result.geonameid);
            const isRecent = resultIdxInRecent !== -1;
            const isRecentAndIsListed = isRecent && resultIdxInRecent < CITY_SEARCH_RESULT_LIMIT;
            return (
              <li
                id={`SearchResult${idx}`}
                key={cityAndStateCode}
                className={`${styles['search-overlay__result']} ${
                  isCurrentLocation && !isRecentAndIsListed
                    ? styles['search-overlay__result--non-recent-current-location']
                    : ''
                } ${idx === highlightedIndex ? styles['search-overlay__result--highlighted'] : ''}`}
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
                <span>{cityAndStateCode}</span>
                {isCurrentLocation ? <LocateIcon></LocateIcon> : <RecentIcon isHidden={!isRecent}></RecentIcon>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
