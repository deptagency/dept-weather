import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { APIRoute, Forecast, getPath, NwsForecastPeriod, Observations, QueryParams, Response } from '../../models/api';
import homeStyles from '../../styles/Home.module.css';
import { ForecastCard, ObservationsCard } from '../Card';

const fetcher = (key: string) => fetch(key).then(res => res.json());
const useObservations = (
  queryParams: QueryParams
): { observations?: Response<Observations>; observationsIsLoading: boolean; observationsIsError: boolean } => {
  const { data, error } = useSWR<Response<Observations>>(
    queryParams != null ? getPath(APIRoute.CURRENT, queryParams) : null,
    fetcher
  );

  return {
    observations: data,
    observationsIsLoading: !error && !data,
    observationsIsError: error
  };
};
const useForecast = (
  queryParams: QueryParams
): { forecast?: Response<Forecast>; forecastIsLoading: boolean; forecastIsError: boolean } => {
  const { data, error } = useSWR<Response<Forecast>>(
    queryParams != null ? getPath(APIRoute.FORECAST, queryParams) : null,
    fetcher
  );

  return {
    forecast: data,
    forecastIsLoading: !error && !data,
    forecastIsError: error
  };
};

const ForecastCards = ({
  isLoading,
  latestReadTime,
  forecasts
}: {
  isLoading?: boolean;
  latestReadTime?: number;
  forecasts: Array<NwsForecastPeriod>;
}) => {
  const cards = [];

  let i = 0;
  if (forecasts.length && !forecasts[0].isDaytime) {
    cards.push(
      <ForecastCard nightForecast={forecasts[0]} isLoading={isLoading} latestReadTime={latestReadTime} key={i++} />
    );
  }

  for (; i < forecasts.length; i += 2) {
    cards.push(
      <ForecastCard
        dayForecast={forecasts[i]}
        nightForecast={i + 1 < forecasts.length ? forecasts[i + 1] : undefined}
        isLoading={isLoading}
        latestReadTime={latestReadTime}
        key={i}
      />
    );
  }
  return <>{cards}</>;
};

export default function Main({ queryParams }: { queryParams: QueryParams }) {
  const { observations, observationsIsLoading, observationsIsError } = useObservations(queryParams);
  const { forecast, forecastIsLoading, forecastIsError } = useForecast(queryParams);

  const [placeholderForecasts, setPlaceholderForecasts] = useState<NwsForecastPeriod[]>([]);

  useEffect(() => {
    const placeholderForecasts: NwsForecastPeriod[] = Array(14);

    let date = new Date(new Date().setHours(0, 0, 0, 0));
    for (let i = 0; i < placeholderForecasts.length; i += 2) {
      placeholderForecasts[i] = {
        isDaytime: true,
        dayName: date.toLocaleString('default', { weekday: 'long' }),
        shortDateName: date.toLocaleString('default', { month: 'short', day: 'numeric' })
      } as NwsForecastPeriod;
      placeholderForecasts[i + 1] = {
        ...placeholderForecasts[i],
        isDaytime: false
      } as NwsForecastPeriod;

      if (i === 0) {
        placeholderForecasts[i].dayName = 'Today';
        placeholderForecasts[i + 1].dayName = 'Tonight';
      }
      date.setDate(date.getDate() + 1);
    }

    setPlaceholderForecasts(placeholderForecasts);
  }, []);

  return (
    <main className={homeStyles.container__content}>
      <ObservationsCard
        isLoading={observationsIsLoading}
        latestReadTime={observations?.latestReadTime ? observations.latestReadTime : undefined}
        observations={observations?.data}
      ></ObservationsCard>
      <ForecastCards
        isLoading={forecastIsLoading}
        latestReadTime={forecast?.latestReadTime ? forecast.latestReadTime : undefined}
        forecasts={forecast?.data?.nws?.forecasts?.length ? forecast.data.nws.forecasts : placeholderForecasts}
      ></ForecastCards>
    </main>
  );
}
