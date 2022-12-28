import { ReactNode, useEffect, useState } from 'react';
import useSWR from 'swr';
import { OfflineError } from 'components/Errors';
import { useOnlineStatus } from 'hooks';
import {
  Alerts,
  APIRoute,
  Forecast,
  getPath,
  NwsAlert,
  NwsPeriod,
  Observations,
  QueryParams,
  Response
} from 'models/api';
import { AlertCard, ForecastCard, ObservationsCard } from '../Card';
import homeStyles from 'styles/Home.module.css';

const fetcher = (key: string) => fetch(key).then(res => res.json());
const useAlerts = (
  queryParams: QueryParams
): { alerts?: Response<Alerts>; alertsIsLoading: boolean; alertsIsError: boolean } => {
  const { data, error, isLoading, isValidating } = useSWR<Response<Alerts>>(
    queryParams != null ? getPath(APIRoute.ALERTS, queryParams) : null,
    fetcher
  );

  return {
    alerts: data,
    alertsIsLoading: isLoading || isValidating,
    alertsIsError: error
  };
};
const useObservations = (
  queryParams: QueryParams
): { observations?: Response<Observations>; observationsIsLoading: boolean; observationsIsError: boolean } => {
  const { data, error, isLoading, isValidating } = useSWR<Response<Observations>>(
    queryParams != null ? getPath(APIRoute.CURRENT, queryParams) : null,
    fetcher
  );

  return {
    observations: data,
    observationsIsLoading: isLoading || isValidating,
    observationsIsError: error
  };
};
const useForecast = (
  queryParams: QueryParams
): { forecast?: Response<Forecast>; forecastIsLoading: boolean; forecastIsError: boolean } => {
  const { data, error, isLoading, isValidating } = useSWR<Response<Forecast>>(
    queryParams != null ? getPath(APIRoute.FORECAST, queryParams) : null,
    fetcher
  );

  return {
    forecast: data,
    forecastIsLoading: isLoading || isValidating,
    forecastIsError: error
  };
};

const AlertCards = ({ alerts, lid }: { alerts: NwsAlert[]; lid: string }) => (
  <>
    {alerts.map((alert, i) => {
      const key = `${lid}-${i}`;
      return <AlertCard key={key} _key={key} alert={alert}></AlertCard>;
    })}
  </>
);

const ForecastCards = ({
  isLoading,
  latestReadTime,
  periods,
  lid
}: {
  isLoading?: boolean;
  latestReadTime?: number;
  periods: NwsPeriod[];
  lid: string;
}) => {
  return (
    <>
      {periods.map((period, idx) => {
        const key = `${lid}-${idx}`;
        return (
          <ForecastCard period={period} isLoading={isLoading} latestReadTime={latestReadTime} key={key} _key={key} />
        );
      })}
    </>
  );
};

export default function Main({ queryParams, children }: { queryParams: QueryParams; children?: ReactNode }) {
  const isOnline = useOnlineStatus();
  const { alerts, alertsIsError } = useAlerts(queryParams);
  const { observations, observationsIsLoading, observationsIsError } = useObservations(queryParams);
  const { forecast, forecastIsLoading, forecastIsError } = useForecast(queryParams);

  const [lid, setLid] = useState<string>('');
  useEffect(() => setLid(String(queryParams?.id ?? '')), [queryParams]);

  const [placeholderPeriods, setPlaceholderPeriods] = useState<NwsPeriod[]>([]);

  useEffect(() => {
    const _placeholderPeriods: NwsPeriod[] = Array(7);
    let date = new Date(new Date().setHours(0, 0, 0, 0));
    for (let i = 0; i < _placeholderPeriods.length; i++) {
      _placeholderPeriods[i] = {
        dayName: i === 0 ? 'Today' : date.toLocaleString('default', { weekday: 'long' }),
        shortDateName: date.toLocaleString('default', { month: 'short', day: 'numeric' }),
        dayForecast: null,
        dayHourlyForecasts: [],
        nightForecast: null,
        nightHourlyForecasts: []
      };
      date.setDate(date.getDate() + 1);
    }
    setPlaceholderPeriods(_placeholderPeriods);
  }, []);

  const [observationsLatestReadTime, setObservationsLatestReadTime] = useState<number | undefined>(undefined);
  useEffect(() => {
    let newObservationsLatestReadTime: number | undefined;

    if (observations != null) {
      let readTimes: number[] = [];
      if (observations.data.wl?.readTime) readTimes.push(observations.data.wl.readTime);
      if (observations.data.nws?.readTime) readTimes.push(observations.data.nws.readTime);

      if (readTimes.length) {
        newObservationsLatestReadTime = Math.max(...readTimes);
      } else if (observations.latestReadTime) {
        newObservationsLatestReadTime = observations.latestReadTime;
      }
    }

    setObservationsLatestReadTime(newObservationsLatestReadTime);
  }, [observations]);

  return (
    <main className={homeStyles.container__content}>
      {children != null ? (
        children
      ) : !isOnline && alertsIsError && observationsIsError && forecastIsError ? (
        <OfflineError></OfflineError>
      ) : (
        <>
          <AlertCards alerts={alerts?.data.nws?.alerts ?? []} lid={lid}></AlertCards>
          <ObservationsCard
            isLoading={observationsIsLoading}
            latestReadTime={observationsLatestReadTime}
            observations={observations?.data}
          ></ObservationsCard>
          <ForecastCards
            isLoading={forecastIsLoading}
            latestReadTime={forecast?.latestReadTime ? forecast!.latestReadTime! : undefined}
            periods={forecast?.data?.nws?.periods?.length ? forecast!.data!.nws!.periods! : placeholderPeriods}
            lid={lid}
          ></ForecastCards>
        </>
      )}
    </main>
  );
}
