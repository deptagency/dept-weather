import { createRef, Dispatch, KeyboardEventHandler, SetStateAction, useEffect, useState } from 'react';
import { IME_UNSETTLED_KEY_CODE } from '@constants';
import { ArrowIcon, DEPTLogoIcon } from 'components/Icons';
import { SearchQueryHelper } from 'helpers';
import { CitiesGIDCache, SearchResultCity } from 'models/cities';
import SearchOverlay from './SearchOverlay/SearchOverlay';
import homeStyles from 'styles/Home.module.css';
import styles from './Header.module.css';

export default function Header({
  showSearchOverlay,
  setShowSearchOverlay,
  selectedCity,
  setSelectedCity,
  recentCities,
  citiesGIDCache
}: {
  showSearchOverlay: boolean;
  setShowSearchOverlay: Dispatch<SetStateAction<boolean>>;
  selectedCity: SearchResultCity | undefined;
  setSelectedCity: Dispatch<SetStateAction<SearchResultCity | undefined>>;
  recentCities: SearchResultCity[];
  citiesGIDCache: CitiesGIDCache | undefined;
}) {
  const [rawSearchQuery, setRawSearchQuery] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [highlightedIndexDistance, setHighlightedIndexDistance] = useState<number>(0);
  const [results, setResults] = useState<SearchResultCity[]>([]);

  const inputRef = createRef<HTMLInputElement>();

  const onHighlightedIndexDistanceChange = (change: number) =>
    setHighlightedIndexDistance(highlightedIndexDistance + change);

  useEffect(() => {
    if (highlightedIndexDistance >= 0) {
      setHighlightedIndex(highlightedIndexDistance % results.length);
    } else {
      const distanceFromEnd = (Math.abs(highlightedIndexDistance) - 1) % results.length;
      setHighlightedIndex(results.length - 1 - distanceFromEnd);
    }
  }, [results, highlightedIndex, highlightedIndexDistance]);

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = event => {
    // Roughly based on material-ui implementation: https://github.com/mui/material-ui/blob/5b7b17c5f0761e71a971b8fb449a3ad27f55b933/packages/mui-base/src/AutocompleteUnstyled/useAutocomplete.js#L728
    // Wait until Input Monitor Editor is settled.
    if (event.code !== IME_UNSETTLED_KEY_CODE) {
      switch (event.key) {
        case 'ArrowDown':
          // Prevent cursor move
          event.preventDefault();
          onHighlightedIndexDistanceChange(1);
          break;
        case 'ArrowUp':
          // Prevent cursor move
          event.preventDefault();
          onHighlightedIndexDistanceChange(-1);
          break;
        case 'Enter':
          if (results.length) {
            setSelectedCity(results[highlightedIndex]);
          }
          setShowSearchOverlay(false);
          inputRef?.current?.blur();
          break;
        case 'Escape':
          // Avoid Opera to exit fullscreen mode.
          event.preventDefault();
          // Avoid the Modal to handle the event.
          event.stopPropagation();
          setShowSearchOverlay(false);
          inputRef?.current?.blur();
          break;
        default:
      }
    }
  };

  return (
    <>
      <div
        className={styles.header__container}
        onClick={e => {
          if (!e.defaultPrevented) {
            setShowSearchOverlay(false);
          }
        }}
      >
        <header className={`${styles.header} ${homeStyles.container__content}`}>
          <h1 className={styles.header__branding}>
            <DEPTLogoIcon></DEPTLogoIcon>
            <span className={`${styles.header__text} ${styles.header__branding__text}`}>Weather</span>
          </h1>
          <div className={styles.header__location}>
            <input
              className={`${styles.header__text} ${styles.header__location__input}`}
              placeholder={selectedCity != null ? 'City, State' : ''}
              aria-label={'Search City, State'}
              aria-expanded={showSearchOverlay}
              aria-controls="SearchResultsList"
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-activedescendant={results.length ? `SearchResult${highlightedIndex}` : undefined}
              role="combobox"
              autoComplete="off"
              type="text"
              ref={inputRef}
              onClick={e => e.preventDefault()}
              onChange={e => setRawSearchQuery(e.target.value)}
              onFocus={e => {
                e.preventDefault();
                if (!showSearchOverlay) {
                  setRawSearchQuery('');
                  setShowSearchOverlay(true);
                }
              }}
              onKeyDown={handleKeyDown}
              value={
                showSearchOverlay
                  ? rawSearchQuery
                  : selectedCity != null
                  ? SearchQueryHelper.getCityAndStateCode(selectedCity)
                  : ''
              }
            ></input>
            <button
              className={`${styles.header__location__arrow} ${
                showSearchOverlay ? styles['header__location__arrow--expanded'] : ''
              }`}
              aria-label={'Location search panel'}
              aria-expanded={showSearchOverlay}
              aria-controls="SearchResultsList"
              onClick={e => {
                e.preventDefault();
                showSearchOverlay ? setShowSearchOverlay(false) : inputRef?.current?.focus();
              }}
            >
              <ArrowIcon></ArrowIcon>
            </button>
          </div>
        </header>
      </div>

      <SearchOverlay
        rawSearchQuery={rawSearchQuery}
        showSearchOverlay={showSearchOverlay}
        setShowSearchOverlay={setShowSearchOverlay}
        results={results}
        setResults={setResults}
        setHighlightedIndexDistance={setHighlightedIndexDistance}
        highlightedIndex={highlightedIndex}
        setSelectedCity={setSelectedCity}
        recentCities={recentCities}
        citiesGIDCache={citiesGIDCache}
      ></SearchOverlay>
    </>
  );
}
