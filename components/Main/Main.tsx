import { ReactNode, useEffect, useState } from 'react';
import { AlertCard } from 'components/Card/AlertCard/AlertCard';
import { ForecastCard } from 'components/Card/ForecastCard';
import { NotificationsCard } from 'components/Card/NotificationsCard/NotificationsCard';
import { ObservationsCard } from 'components/Card/ObservationsCard';
import { OfflineError } from 'components/Errors/OfflineError/OfflineError';
import { DEFAULT_UNITS } from 'constants/shared';
import { useOnlineStatus } from 'hooks/use-online-status';
import { Alerts, NwsAlert } from 'models/api/alerts.model';
import { APIRoute, getPath, QueryParams } from 'models/api/api-route.model';
import { Forecast, NwsPeriod } from 'models/api/forecast.model';
import { Observations } from 'models/api/observations.model';
import { Response } from 'models/api/response.model';
import { SearchResultCity } from 'models/cities/cities.model';
import { UnitChoices, UnitType } from 'models/unit.enum';
import useSWR from 'swr';

import homeStyles from 'styles/Home.module.css';

const fetcher = (key: string) => fetch(key).then(res => res.json());
const useAlerts = (
  queryParamsLocation: QueryParams
): {
  alerts?: Response<Alerts>;
  alertsIsLoading: boolean;
  alertsIsError: boolean;
} => {
  const { data, error, isLoading, isValidating } = useSWR<Response<Alerts>>(
    queryParamsLocation != null ? getPath(APIRoute.ALERTS, queryParamsLocation) : null,
    fetcher
  );

  return {
    alerts: data,
    alertsIsLoading: isLoading || isValidating,
    alertsIsError: error
  };
};
const useObservations = (
  queryParamsLocation: QueryParams,
  queryParamsUnits: NonNullable<QueryParams>
): {
  observations?: Response<Observations>;
  observationsIsLoading: boolean;
  observationsIsError: boolean;
} => {
  const { data, error, isLoading, isValidating } = useSWR<Response<Observations>>(
    queryParamsLocation != null ? getPath(APIRoute.CURRENT, { ...queryParamsLocation, ...queryParamsUnits }) : null,
    fetcher
  );

  return {
    observations: data,
    observationsIsLoading: isLoading || isValidating,
    observationsIsError: error
  };
};
const useForecast = (
  queryParamsLocation: QueryParams,
  queryParamsUnits: NonNullable<QueryParams>
): {
  forecast?: Response<Forecast>;
  forecastIsLoading: boolean;
  forecastIsError: boolean;
} => {
  const { data, error, isLoading, isValidating } = useSWR<Response<Forecast>>(
    queryParamsLocation != null ? getPath(APIRoute.FORECAST, { ...queryParamsLocation, ...queryParamsUnits }) : null,
    fetcher
  );

  return {
    forecast: data,
    forecastIsLoading: isLoading || isValidating,
    forecastIsError: error
  };
};

const AlertCards = ({
  alerts,
  expandedAlertId,
  lid
}: {
  alerts: NwsAlert[];
  expandedAlertId: string | undefined;
  lid: string;
}) => (
  <>
    {alerts.map((alert, i) => {
      const key = `${lid}-${i}`;
      return <AlertCard _key={key} alert={alert} isExpandedByUrl={expandedAlertId === alert.id} key={key} />;
    })}
  </>
);

const ForecastCards = ({
  units,
  isLoading,
  latestReadTime,
  periods,
  lid
}: {
  units: Pick<UnitChoices, UnitType.wind>;
  isLoading?: boolean;
  latestReadTime?: number;
  periods: NwsPeriod[];
  lid: string;
}) => (
  <>
    {periods.map((period, idx) => {
      const key = `${lid}-${idx}`;
      return (
        <ForecastCard
          _key={key}
          isLoading={isLoading}
          key={key}
          latestReadTime={latestReadTime}
          period={period}
          units={units}
        />
      );
    })}
  </>
);

export function Main({
  queryParamsLocation,
  queryParamsUnits,
  selectedCity,
  expandedAlertId,
  children
}: {
  queryParamsLocation: QueryParams;
  queryParamsUnits: Partial<UnitChoices>;
  selectedCity: SearchResultCity | undefined;
  expandedAlertId: string | undefined;
  children?: ReactNode;
}) {
  const isOnline = useOnlineStatus();
  const { alerts, alertsIsError } = useAlerts(queryParamsLocation);
  const { observations, observationsIsLoading, observationsIsError } = useObservations(
    queryParamsLocation,
    queryParamsUnits
  );
  const { forecast, forecastIsLoading, forecastIsError } = useForecast(queryParamsLocation, queryParamsUnits);

  const [lid, setLid] = useState<string>('');
  useEffect(() => setLid(String(queryParamsLocation?.id ?? '')), [queryParamsLocation]);

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

  const [units, setUnits] = useState(DEFAULT_UNITS);
  useEffect(() => setUnits({ ...DEFAULT_UNITS, ...queryParamsUnits }), [queryParamsUnits]);

  return (
    <main className={homeStyles.container__content}>
      {children != null ? (
        children
      ) : !isOnline && alertsIsError && observationsIsError && forecastIsError ? (
        <OfflineError />
      ) : (
        <>
          <NotificationsCard selectedCity={selectedCity} />
          <AlertCards alerts={alerts?.data?.nws?.alerts ?? []} expandedAlertId={expandedAlertId} lid={lid} />
          <ObservationsCard
            isLoading={observationsIsLoading}
            latestReadTime={observationsLatestReadTime}
            observations={observations?.data}
            units={units}
          />
          <ForecastCards
            isLoading={forecastIsLoading}
            latestReadTime={forecast?.latestReadTime ? forecast!.latestReadTime! : undefined}
            lid={lid}
            periods={forecast?.data?.nws?.periods?.length ? forecast!.data!.nws!.periods! : placeholderPeriods}
            units={units}
          />
        </>
      )}
    </main>
  );
}
