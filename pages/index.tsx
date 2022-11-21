import Head from 'next/head';
import { NextRouter, useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import useSWRImmutable from 'swr/immutable';
import { Footer, Header, Main } from 'components';
import {
  API_COORDINATES_KEY,
  API_GEONAMEID_KEY,
  APP_MASK_ICON_COLOR,
  APP_TITLE,
  CURRENT_LOCATION,
  DEFAULT_CITY,
  GID_CACHE_FILENAME,
  LOCAL_STORAGE_RECENT_CITIES_KEY,
  SEARCH_PANEL_ANIMATION_DURATION
} from '@constants';
import { CoordinatesHelper, SearchQueryHelper } from 'helpers';
import { APIRoute, getPath, QueryParams } from 'models/api';
import { CitiesGIDCache, SearchResultCity } from 'models/cities';

const getGeonameidFromUrl = (router: NextRouter) => {
  let geonameidStr = router.query[API_GEONAMEID_KEY];
  if (typeof geonameidStr === 'string' && geonameidStr.length) {
    const geonameid = Number(geonameidStr);
    if (Number.isInteger(geonameid) && geonameid >= 0) {
      return geonameid;
    }
  }
  return undefined;
};

const getQueryParamsForGeonameid = (geonameid: number): QueryParams => ({
  [API_GEONAMEID_KEY]: geonameid
});

const fetcher = (key: string) => fetch(key).then(res => res.json());

const useCitiesGIDCache = (): CitiesGIDCache | undefined => {
  const { data } = useSWRImmutable<CitiesGIDCache | undefined>(GID_CACHE_FILENAME, fetcher);
  return data?.gidQueryCache != null && data.gidCityAndStateCodeCache != null ? data : undefined;
};

export default function Home() {
  const router = useRouter();
  const geonameid = getGeonameidFromUrl(router);
  const [selectedCity, setSelectedCity] = useState<SearchResultCity | undefined>(undefined);
  const [queryParams, setQueryParams] = useState<QueryParams>(undefined);

  const citiesGIDCache = useCitiesGIDCache();

  const [recentCities, setRecentCities] = useState<SearchResultCity[]>((): SearchResultCity[] => {
    // Only run on client-side (i.e., when window object is available)
    if (typeof window !== 'undefined') {
      const recentCitiesStr = localStorage.getItem(LOCAL_STORAGE_RECENT_CITIES_KEY);
      return recentCitiesStr ? JSON.parse(recentCitiesStr) : [];
    }
    return [];
  });
  useEffect(() => {
    // Wait until selectedCity & queryParams are defined and in-sync before adding to recents
    //  When the current location is selected, this effectively waits until the user's location is successfully obtained
    const isCurrentSelected = selectedCity?.geonameid === CURRENT_LOCATION.geonameid;
    if (
      recentCities != null &&
      selectedCity != null &&
      queryParams != null &&
      ((!isCurrentSelected && queryParams[API_GEONAMEID_KEY] === selectedCity.geonameid) ||
        (isCurrentSelected && queryParams[API_COORDINATES_KEY] != null))
    ) {
      const idxOfSelectedInRecents = recentCities.findIndex(city => city.geonameid === selectedCity.geonameid);
      if (idxOfSelectedInRecents === -1 || idxOfSelectedInRecents > 0) {
        let newRecentCities = [...recentCities];

        if (idxOfSelectedInRecents >= 0) {
          newRecentCities.splice(idxOfSelectedInRecents, 1);
        }
        newRecentCities.unshift({
          cityAndStateCode: SearchQueryHelper.getCityAndStateCode(selectedCity),
          geonameid: selectedCity.geonameid
        });

        const newRecentCitiesStr = JSON.stringify(newRecentCities);
        localStorage.setItem(LOCAL_STORAGE_RECENT_CITIES_KEY, newRecentCitiesStr);

        if (isCurrentSelected) {
          setRecentCities(newRecentCities);
        } else {
          // Wait for search panel close animation before adding to recents list to avoid showing recent icon before loading city
          setTimeout(() => setRecentCities(newRecentCities), SEARCH_PANEL_ANIMATION_DURATION);
        }
      }
    }
  }, [recentCities, selectedCity, queryParams]);

  useEffect(() => {
    // Wait until geonameid & selectedCity are defined and in-sync before calling setQueryParams()
    if (geonameid != null && selectedCity != null && geonameid === selectedCity.geonameid) {
      if (geonameid === CURRENT_LOCATION.geonameid) {
        // Clear previous data by using undefined query params, wait for current location coordinates, then update query params
        setQueryParams(undefined);
        navigator.geolocation.getCurrentPosition(
          position => {
            const adjustedCoordinates = CoordinatesHelper.adjustPrecision(
              CoordinatesHelper.cityToNumArr(position.coords)
            );
            setQueryParams({ [API_COORDINATES_KEY]: CoordinatesHelper.numArrToStr(adjustedCoordinates) });
          },
          error => {
            alert(`Error: ${error.code} - ${error.message}`);
          }
        );
      } else {
        setQueryParams(getQueryParamsForGeonameid(geonameid));
      }
    }
  }, [geonameid, selectedCity, router]);

  const controllerRef = useRef<AbortController | undefined>();
  useEffect(() => {
    const searchAndSetSelectedCity = async (searchGeonameid: number) => {
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
    router.beforePopState(_ => {
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
          ? router.replace(href, href, { shallow: true })
          : router.push(href, href, { shallow: true });
      }
    }
  }, [geonameid, selectedCity, router, isPopState]);

  const [showSearchOverlay, setShowSearchOverlay] = useState<boolean>(false);
  useEffect(() => {
    const className = 'body--disable-scroll';
    showSearchOverlay ? document.body.classList.add(className) : document.body.classList.remove(className);
  }, [showSearchOverlay]);

  return (
    <>
      <Head>
        <title>
          {selectedCity != null ? `${SearchQueryHelper.getCityAndStateCode(selectedCity)} | ${APP_TITLE}` : APP_TITLE}
        </title>
        <meta
          name="description"
          content={`The ${APP_TITLE} app provides up-to-date weather information and forecasts for locations across the U.S.`}
        />
        <meta name="apple-mobile-web-app-title" content={APP_TITLE} />
        <meta name="application-name" content={APP_TITLE} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/favicon.svg" color={APP_MASK_ICON_COLOR} />
      </Head>
      <Header
        showSearchOverlay={showSearchOverlay}
        setShowSearchOverlay={setShowSearchOverlay}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        recentCities={recentCities}
        citiesGIDCache={citiesGIDCache}
      ></Header>
      <Main queryParams={queryParams}></Main>
      <Footer></Footer>
    </>
  );
}
