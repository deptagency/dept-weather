import Head from 'next/head';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Footer, ForecastCard, Header, ObservationsCard } from '../components';
import { API_COORDINATES_KEY, DEFAULT_CITY } from '../constants';
import { CoordinatesHelper } from '../helpers';
import { APIRoute, Forecast, getPath, NwsForecastPeriod, Observations, Response } from '../models/api';
import { City } from '../models/cities';
import styles from '../styles/Home.module.css';

const fetcher = (key: string) => fetch(key).then(res => res.json());

const getQueryParamsForCity = (city: City) => ({
  [API_COORDINATES_KEY]: CoordinatesHelper.numArrToStr(
    CoordinatesHelper.adjustPrecision(CoordinatesHelper.cityToNumArr(city))
  )
});

const useObservations = (
  city: City
): { observations?: Response<Observations>; isLoading: boolean; isError: boolean } => {
  const { data, error } = useSWR<Response<Observations>>(
    getPath(APIRoute.CURRENT, getQueryParamsForCity(city)),
    fetcher
  );

  return {
    observations: data,
    isLoading: !error && !data,
    isError: error
  };
};

const useForecast = (
  city: City
): { forecast?: Response<Forecast>; forecastIsLoading: boolean; forecastIsError: boolean } => {
  const { data, error } = useSWR<Response<Forecast>>(getPath(APIRoute.FORECAST, getQueryParamsForCity(city)), fetcher);

  return {
    forecast: data,
    forecastIsLoading: !error && !data,
    forecastIsError: error
  };
};

const ForecastCards = ({
  latestReadTime,
  forecasts
}: {
  latestReadTime: number;
  forecasts: Array<NwsForecastPeriod>;
}) => {
  const cards = [];

  let i = 0;
  if (!forecasts[0].isDaytime) {
    cards.push(<ForecastCard nightForecast={forecasts[0]} latestReadTime={latestReadTime} key={i++} />);
  }

  for (; i < forecasts.length; i += 2) {
    cards.push(
      <ForecastCard
        dayForecast={forecasts[i]}
        nightForecast={i + 1 < forecasts.length ? forecasts[i + 1] : undefined}
        latestReadTime={latestReadTime}
        key={i}
      />
    );
  }
  return cards;
};

export default function Home() {
  // TODO - useState() here and pass to Header component
  const selectedCity = DEFAULT_CITY;
  const { observations, isLoading, isError } = useObservations(selectedCity);
  const { forecast, forecastIsLoading, forecastIsError } = useForecast(selectedCity);

  const [showSearchOverlay, setShowSearchOverlay] = useState<boolean>(false);
  useEffect(() => {
    const className = 'overflow-y-hidden';
    showSearchOverlay ? document.body.classList.add(className) : document.body.classList.remove(className);
  }, [showSearchOverlay]);

  return (
    <div className={`${styles.container} ${showSearchOverlay ? styles['container--overlay-visible'] : ''}`}>
      <Head>
        <title>DEPT® Weather</title>
        <meta
          name="description"
          content="The DEPT® Weather app provides up-to-date weather information and forecasts for locations across the U.S."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header showSearchOverlay={showSearchOverlay} setShowSearchOverlay={setShowSearchOverlay}></Header>
      <main className={styles.container__content}>
        {observations ? (
          !isError && observations.data ? (
            <ObservationsCard observations={observations}></ObservationsCard>
          ) : (
            <h2>Couldn’t fetch current conditions</h2>
          )
        ) : (
          <h2>Loading observations...</h2>
        )}
        {forecast ? (
          !forecastIsError && forecast.data?.nws?.forecasts?.length ? (
            ForecastCards({
              latestReadTime: forecast.latestReadTime,
              forecasts: forecast.data.nws.forecasts
            })
          ) : (
            <h2>Couldn’t fetch forecast</h2>
          )
        ) : (
          <h2>Loading forecast...</h2>
        )}
      </main>
      <Footer></Footer>
    </div>
  );
}
