import { createRef, Dispatch, KeyboardEventHandler, SetStateAction, useEffect, useState } from 'react';
import { IME_UNSETTLED_KEY_CODE } from 'constants/client';
import { ArrowIcon, DEPTLogoIcon } from 'components/Icons';
import { SearchQueryHelper } from 'helpers';
import { CitiesCache, SearchResultCity } from 'models/cities';
import SearchOverlay from './SearchOverlay/SearchOverlay';
import homeStyles from 'styles/Home.module.css';
import styles from './Header.module.css';

export default function Header({
  showSearchOverlay,
  setShowSearchOverlay,
  selectedCity,
  setSelectedCity,
  recentCities,
  citiesCache
}: {
  showSearchOverlay: boolean;
  setShowSearchOverlay: Dispatch<SetStateAction<boolean>>;
  selectedCity: SearchResultCity | undefined;
  setSelectedCity: Dispatch<SetStateAction<SearchResultCity | undefined>>;
  recentCities: SearchResultCity[];
  citiesCache: CitiesCache | undefined;
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
    // Show search overlay on keydown, since input would be focused here
    if (!showSearchOverlay && event.key !== 'Tab') {
      setRawSearchQuery('');
      setShowSearchOverlay(true);
      return;
    }

    // Roughly based on material-ui implementation: https://github.com/mui/material-ui/blob/5b7b17c5f0761e71a971b8fb449a3ad27f55b933/packages/mui-base/src/AutocompleteUnstyled/useAutocomplete.js#L728
    // Wait until Input Monitor Editor is settled.
    if (event.code !== IME_UNSETTLED_KEY_CODE) {
      if (event.key === 'ArrowDown') {
        // Prevent cursor move
        event.preventDefault();
        onHighlightedIndexDistanceChange(1);
      } else if (event.key === 'ArrowUp') {
        // Prevent cursor move
        event.preventDefault();
        onHighlightedIndexDistanceChange(-1);
      } else if (event.key === 'Enter') {
        if (results.length) {
          setSelectedCity(results[highlightedIndex]);
        }
        setShowSearchOverlay(false);
        inputRef?.current?.blur();
      } else if (event.key === 'Escape' || event.key === 'Tab') {
        if (event.key === 'Escape') {
          // Avoid Opera to exit fullscreen mode.
          event.preventDefault();
          // Avoid the Modal to handle the event.
          event.stopPropagation();
        }
        setShowSearchOverlay(false);
        if (event.key === 'Escape') {
          inputRef?.current?.blur();
        }
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
          <h1 className={styles.header__branding} aria-label="DEPT® Weather">
            <DEPTLogoIcon aria-hidden="true"></DEPTLogoIcon>
            <span className={`${styles.header__text} ${styles.header__branding__text}`} aria-hidden={true}>
              Weather
            </span>
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
              onChange={e => setRawSearchQuery(e.target.value)}
              onClick={e => {
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
              className={styles.header__location__arrow}
              aria-label={'Location search panel'}
              aria-expanded={showSearchOverlay}
              aria-controls="SearchResultsList"
              onClick={e => {
                e.preventDefault();
                if (showSearchOverlay) {
                  setShowSearchOverlay(false);
                } else {
                  inputRef?.current?.click();
                  inputRef?.current?.focus();
                }
              }}
            >
              <ArrowIcon animationState={showSearchOverlay ? 'end' : 'start'}></ArrowIcon>
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
        citiesCache={citiesCache}
      ></SearchOverlay>
    </>
  );
}
