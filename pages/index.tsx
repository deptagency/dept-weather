import { useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { NextRouter, useRouter } from 'next/router';
import { LocateError } from 'components/Errors/LocateError/LocateError';
import { Footer } from 'components/Footer/Footer';
import { Header } from 'components/Header/Header';
import { ShowOverlayType } from 'components/Header/Header.types';
import { Main } from 'components/Main/Main';
import {
  APP_TITLE,
  CITIES_CACHE_FILENAME,
  CURRENT_LOCATION,
  LocalStorageKey,
  QUERY_EXPANDED_ALERT_ID_KEY,
  UI_ANIMATION_DURATION
} from 'constants/client';
import { API_COORDINATES_KEY, API_GEONAMEID_KEY, DEFAULT_CITY, DEFAULT_UNITS } from 'constants/shared';
import { CoordinatesHelper } from 'helpers/coordinates-helper';
import { SearchQueryHelper } from 'helpers/search-query-helper';
import { getLocalStorageItem, setLocalStorageItem } from 'hooks/use-local-storage';
import { APIRoute, getPath, QueryParams } from 'models/api/api-route.model';
import { CitiesCache, SearchResultCity } from 'models/cities/cities.model';
import { UnitChoices, UnitType } from 'models/unit.enum';
import useSWRImmutable from 'swr/immutable';

const getGeonameidFromUrl = (routerQuery: NextRouter['query']) => {
  const geonameid = routerQuery[API_GEONAMEID_KEY];
  if (typeof geonameid === 'string' && geonameid.length) {
    const geonameidNum = Number(geonameid);
    if (Number.isInteger(geonameidNum) && geonameidNum >= 0) {
      return geonameid;
    }
  }
  return undefined;
};

const getExpandedAlertIdFromUrl = (routerQuery: NextRouter['query']) => {
  const expandedAlertId = routerQuery[QUERY_EXPANDED_ALERT_ID_KEY];
  return typeof expandedAlertId === 'string' && expandedAlertId.length ? expandedAlertId : undefined;
};

const getQueryParamsUnits = (): NonNullable<QueryParams> => {
  const unitChoices = JSON.parse(getLocalStorageItem(LocalStorageKey.UNITS) ?? '{}') as Partial<UnitChoices>;
  return Object.fromEntries(
    Object.entries(unitChoices)
      .filter(([unitType, unit]) => DEFAULT_UNITS[unitType as UnitType] !== unit)
      .map(([k, v]) => [`${k}Unit`, v])
  );
};

const getQueryParamsForGeonameid = (geonameid: string): QueryParams => ({
  [API_GEONAMEID_KEY]: geonameid
});

const fetcher = (key: string) => fetch(key).then(res => res.json());

const useCitiesCache = (): CitiesCache | undefined => {
  const { data } = useSWRImmutable<CitiesCache | undefined>(CITIES_CACHE_FILENAME, fetcher);
  return data?.queryCache != null && data.cityAndStateCodeCache != null ? data : undefined;
};

export default function Home() {
  const router = useRouter();
  const geonameid = getGeonameidFromUrl(router.query);
  const expandedAlertId = getExpandedAlertIdFromUrl(router.query);
  const [selectedCity, setSelectedCity] = useState<SearchResultCity | undefined>(undefined);
  const [queryParamsLocation, setQueryParamsLocation] = useState<QueryParams>(undefined);
  const [locateError, setLocateError] = useState<number | undefined>(undefined);

  const [queryParamsUnits, setQueryParamsUnits] = useState<NonNullable<QueryParams>>(() => getQueryParamsUnits());
  const onUnitChoicesChange = useCallback(() => setQueryParamsUnits(getQueryParamsUnits()), [setQueryParamsUnits]);

  const citiesCache = useCitiesCache();

  const [recentCities, setRecentCities] = useState<SearchResultCity[]>((): SearchResultCity[] => {
    const recentCitiesStr = getLocalStorageItem(LocalStorageKey.RECENT_CITIES);
    const parsedRecentCities = recentCitiesStr ? JSON.parse(recentCitiesStr) : [];
    for (const recentCity of parsedRecentCities) {
      // Convert number-typed geoname ids to strings
      if (typeof recentCity.geonameid === 'number') {
        recentCity.geonameid = String(recentCity.geonameid);
      }
    }
    return parsedRecentCities;
  });
  useEffect(() => {
    // Wait until selectedCity & queryParams are defined and in-sync before adding to recents
    //  When the current location is selected, this effectively waits until the user's location is successfully obtained
    const isCurrentSelected = selectedCity?.geonameid === CURRENT_LOCATION.geonameid;
    if (
      recentCities != null &&
      selectedCity != null &&
      queryParamsLocation != null &&
      ((!isCurrentSelected && queryParamsLocation[API_GEONAMEID_KEY] === selectedCity.geonameid) ||
        (isCurrentSelected && queryParamsLocation[API_COORDINATES_KEY] != null))
    ) {
      const idxOfSelectedInRecents = recentCities.findIndex(city => city.geonameid === selectedCity.geonameid);
      if (idxOfSelectedInRecents === -1 || idxOfSelectedInRecents > 0) {
        const newRecentCities = [...recentCities];

        if (idxOfSelectedInRecents >= 0) {
          newRecentCities.splice(idxOfSelectedInRecents, 1);
        }
        newRecentCities.unshift({
          cityAndStateCode: SearchQueryHelper.getCityAndStateCode(selectedCity),
          geonameid: selectedCity.geonameid
        });

        setLocalStorageItem(LocalStorageKey.RECENT_CITIES, newRecentCities);

        if (isCurrentSelected) {
          setRecentCities(newRecentCities);
        } else {
          // Wait for search panel close animation before adding to recents list to avoid showing recent icon before loading city
          setTimeout(() => setRecentCities(newRecentCities), UI_ANIMATION_DURATION);
        }
      }
    }
  }, [recentCities, selectedCity, queryParamsLocation]);

  useEffect(() => {
    // Wait until geonameid & selectedCity are defined and in-sync before calling setQueryParams()
    if (geonameid != null && selectedCity != null && geonameid === selectedCity.geonameid) {
      if (geonameid === CURRENT_LOCATION.geonameid) {
        // Clear previous data by using undefined query params, wait for current location coordinates, then update query params
        setQueryParamsLocation(undefined);
        navigator.geolocation.getCurrentPosition(
          position => {
            const adjustedCoordinates = CoordinatesHelper.adjustPrecision(
              CoordinatesHelper.cityToNumArr(position.coords)
            );
            setQueryParamsLocation({ [API_COORDINATES_KEY]: CoordinatesHelper.numArrToStr(adjustedCoordinates) });
          },
          error => {
            setLocateError(error.code);
            if ('permissions' in navigator) {
              navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
                permissionStatus.onchange = () => {
                  setSelectedCity(undefined);
                  setLocateError(undefined);
                };
              });
            }
          }
        );
      } else {
        setQueryParamsLocation(getQueryParamsForGeonameid(geonameid));
        setLocateError(undefined);
      }
    }
  }, [geonameid, selectedCity, router]);

  const controllerRef = useRef<AbortController | undefined>();
  useEffect(() => {
    const searchAndSetSelectedCity = async (searchGeonameid: string) => {
      // Abort any pending search
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      // Avoid calling API for CURRENT_LOCATION or recent city with matching geonameid
      if (searchGeonameid === CURRENT_LOCATION.geonameid) {
        setSelectedCity(CURRENT_LOCATION);
        return;
      }
      const recentCityWithMatchingId = recentCities.find(city => city.geonameid === searchGeonameid);
      if (recentCityWithMatchingId != null) {
        setSelectedCity(recentCityWithMatchingId);
        return;
      }

      // Call /city-search API
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const res = await fetch(getPath(APIRoute.CITY_SEARCH, getQueryParamsForGeonameid(searchGeonameid)), {
          signal: controllerRef.current?.signal
        });
        const resJSON = await res.json();
        if (resJSON.data?.length) {
          setSelectedCity(resJSON.data[0]);
        } else {
          throw new Error('API did not return a result');
        }
      } catch (e) {
        if (e instanceof Error && e?.name !== 'AbortError') {
          setSelectedCity(DEFAULT_CITY);
        }
      }
    };

    if (geonameid != null) {
      if (selectedCity == null) {
        searchAndSetSelectedCity(geonameid);
      }
    } else if (router.isReady) {
      setSelectedCity(recentCities.length ? recentCities[0] : DEFAULT_CITY);
    }
  }, [geonameid, recentCities, selectedCity, router.isReady]);

  const [isPopState, setIsPopState] = useState<boolean>(false);
  useEffect(() => {
    router.beforePopState(() => {
      setIsPopState(true);
      return true;
    });
  }, [router]);
  useEffect(() => {
    if (selectedCity != null && geonameid !== selectedCity.geonameid) {
      if (isPopState) {
        setSelectedCity(undefined);
        setIsPopState(false);
      } else {
        const href = `/?${API_GEONAMEID_KEY}=${selectedCity.geonameid}`;
        selectedCity === DEFAULT_CITY
          ? router.replace(href, href, { scroll: true, shallow: true })
          : router.push(href, href, { scroll: true, shallow: true });
      }
    }
  }, [geonameid, selectedCity, router, isPopState]);

  const [showOverlay, setShowOverlay] = useState<ShowOverlayType>(false);
  useEffect(() => {
    const className = 'body--disable-scroll';
    showOverlay ? document.body.classList.add(className) : document.body.classList.remove(className);
  }, [showOverlay]);

  return (
    <>
      <Head>
        <title>
          {selectedCity != null ? `${SearchQueryHelper.getCityAndStateCode(selectedCity)} | ${APP_TITLE}` : APP_TITLE}
        </title>
      </Head>
      <Header
        citiesCache={citiesCache}
        onUnitChoicesChange={onUnitChoicesChange}
        recentCities={recentCities}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        setShowOverlay={setShowOverlay}
        showOverlay={showOverlay}
      />
      <Main
        expandedAlertId={expandedAlertId}
        queryParamsLocation={queryParamsLocation}
        queryParamsUnits={queryParamsUnits}
        selectedCity={selectedCity}
      >
        {locateError != null ? <LocateError locateError={locateError} /> : undefined}
      </Main>
      <Footer />
    </>
  );
}
