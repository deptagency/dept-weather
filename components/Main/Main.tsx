import { ReactNode, useEffect, useState } from 'react';
import { AlertCard } from 'components/Card/AlertCard/AlertCard';
import { ForecastCard } from 'components/Card/ForecastCard';
import { ObservationsCard } from 'components/Card/ObservationsCard';
import { OfflineError } from 'components/Errors/OfflineError/OfflineError';
import { useOnlineStatus } from 'hooks/use-online-status';
import { Alerts, NwsAlert } from 'models/api/alerts.model';
import { APIRoute, getPath, QueryParams } from 'models/api/api-route.model';
import { Forecast, NwsPeriod } from 'models/api/forecast.model';
import { Observations } from 'models/api/observations.model';
import { Response } from 'models/api/response.model';
import useSWR from 'swr';

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
      return <AlertCard _key={key} alert={alert} key={key} />;
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
}) => (
  <>
    {periods.map((period, idx) => {
      const key = `${lid}-${idx}`;
      return (
        <ForecastCard _key={key} isLoading={isLoading} key={key} latestReadTime={latestReadTime} period={period} />
      );
    })}
  </>
);

export function Main({ queryParams, children }: { queryParams: QueryParams; children?: ReactNode }) {
  const isOnline = useOnlineStatus();
  const { alerts, alertsIsError } = useAlerts(queryParams);
  const { observations, observationsIsLoading, observationsIsError } = useObservations(queryParams);
  const { forecast, forecastIsLoading, forecastIsError } = useForecast(queryParams);

  const [lid, setLid] = useState<string>('');
  useEffect(() => setLid(String(queryParams?.id ?? '')), [queryParams]);

  const [placeholderPeriods, setPlaceholderPeriods] = useState<NwsPeriod[]>([]);

  useEffect(() => {
    const _placeholderPeriods: NwsPeriod[] = Array(7);
    const date = new Date(new Date().setHours(0, 0, 0, 0));
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
      const readTimes: number[] = [];
      if (observations.data?.wl?.readTime) readTimes.push(observations.data.wl.readTime);
      if (observations.data?.nws?.readTime) readTimes.push(observations.data.nws.readTime);

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
        <OfflineError />
      ) : (
        <>
          <AlertCards alerts={alerts?.data?.nws?.alerts ?? []} lid={lid} />
          <ObservationsCard
            isLoading={observationsIsLoading}
            latestReadTime={observationsLatestReadTime}
            observations={observations?.data}
          />
          <ForecastCards
            isLoading={forecastIsLoading}
            latestReadTime={forecast?.latestReadTime ? forecast!.latestReadTime! : undefined}
            lid={lid}
            periods={forecast?.data?.nws?.periods?.length ? forecast!.data!.nws!.periods! : placeholderPeriods}
          />
        </>
      )}
    </main>
  );
}
