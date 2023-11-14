import { createRef, Dispatch, KeyboardEventHandler, SetStateAction, useEffect, useState } from 'react';
import { SearchOverlay } from 'components/Header/SearchOverlay/SearchOverlay';
import { ArrowIcon } from 'components/Icons/ArrowIcon';
import { DEPTLogoIcon } from 'components/Icons/DEPTLogoIcon';
import { SettingsIcon } from 'components/Icons/SettingsIcon';
import { IME_UNSETTLED_KEY_CODE } from 'constants/client';
import { SearchQueryHelper } from 'helpers/search-query-helper';
import { CitiesCache, SearchResultCity } from 'models/cities/cities.model';

import styles from './Header.module.css';
import homeStyles from 'styles/Home.module.css';

export function Header({
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
          <h1 aria-label="DEPT® Weather" className={styles.header__branding}>
            <DEPTLogoIcon aria-hidden="true" />
            <span aria-hidden={true} className={`${styles.header__text} ${styles.header__branding__text}`}>
              Weather
            </span>
          </h1>
          <div className={styles.header__configure}>
            <div
              className={`animated ${styles.header__location} ${
                showSearchOverlay ? styles['header__location--end'] : ''
              }`}
            >
              <input
                aria-activedescendant={results.length ? `SearchResult${highlightedIndex}` : undefined}
                aria-autocomplete="list"
                aria-controls="SearchResultsList"
                aria-expanded={showSearchOverlay}
                aria-haspopup="listbox"
                aria-label={'Search City, State'}
                autoComplete="off"
                className={`${styles.header__text} ${styles.header__location__input}`}
                onChange={e => setRawSearchQuery(e.target.value)}
                onClick={e => {
                  e.preventDefault();
                  if (!showSearchOverlay) {
                    setRawSearchQuery('');
                    setShowSearchOverlay(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={selectedCity != null ? 'City, State' : ''}
                ref={inputRef}
                role="combobox"
                type="text"
                value={
                  showSearchOverlay
                    ? rawSearchQuery
                    : selectedCity != null
                    ? SearchQueryHelper.getCityAndStateCode(selectedCity)
                    : ''
                }
              />
              <button
                aria-controls="SearchResultsList"
                aria-expanded={showSearchOverlay}
                aria-label={'Location search panel'}
                className={`${styles.header__configure__button} ${styles['header__location__button-arrow']}`}
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
                <ArrowIcon animationState={showSearchOverlay ? 'end' : 'start'} />
              </button>
            </div>
            <button
              // TODO
              aria-label="Settings"
              className={`animated ${styles.header__configure__button} ${
                styles['header__configure__button-settings']
              } ${showSearchOverlay ? styles['header__configure__button-settings--hidden'] : ''}`}
            >
              <SettingsIcon />
            </button>
          </div>
        </header>
      </div>

      <SearchOverlay
        citiesCache={citiesCache}
        highlightedIndex={highlightedIndex}
        rawSearchQuery={rawSearchQuery}
        recentCities={recentCities}
        results={results}
        setHighlightedIndexDistance={setHighlightedIndexDistance}
        setResults={setResults}
        setSelectedCity={setSelectedCity}
        setShowSearchOverlay={setShowSearchOverlay}
        showSearchOverlay={showSearchOverlay}
      />
    </>
  );
}
