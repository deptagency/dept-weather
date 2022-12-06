import { ReactNode, useEffect, useState } from 'react';
import useSWR from 'swr';
import { OfflineError } from 'components/Errors';
import { useOnlineStatus } from 'hooks';
import { APIRoute, Forecast, getPath, NwsForecastPeriod, Observations, QueryParams, Response } from 'models/api';
import { AlertCard, ForecastCard, ObservationsCard } from '../Card';
import homeStyles from 'styles/Home.module.css';

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

const now = new Date().getTime() / 1_000;
const MOCK_ALERTS = [
  {
    severity: 'extreme',
    title: 'Tornado Warning',
    expiration: now + 1 * 60 * 60, // now + 1 hour
    description: (
      <p>
        A tornado has been sighted in the area, and you should take immediate action to protect yourself and your
        property. Seek shelter in a sturdy building, and stay away from windows and doors. If you are in a vehicle, get
        out and find shelter immediately. The tornado is moving in a southeasterly direction and is expected to reach
        the town of Wichita within the next 30 minutes. This is a life-threatening situation, and you should follow the
        instructions of local authorities and emergency responders. The National Weather Service will provide updates as
        more information becomes available.
      </p>
    )
  },
  {
    severity: 'severe',
    title: 'Winter Storm Warning',
    expiration: now + 15 * 60, // now + 15 mins
    description: (
      <>
        <p>* WHAT...Heavy snow expected. Total snow accumulations of 8 to 10 inches.</p>
        <p>* WHERE...Deltana and Tanana Flats.</p>
        <p>* WHEN...From 9 PM this evening to 9 PM AKST Thursday.</p>
        <p>* IMPACTS...Travel could be very difficult to impossible.</p>
        <p>* ADDITIONAL DETAILS...Heaviest snow east of Delta Junction</p>
        <p>
          A Winter Storm Warning for snow means severe winter weather conditions are expected or occurring. This will
          make travel very difficult or impossible. The latest road conditions can be obtained by calling 5 1 1.
        </p>
      </>
    )
  },
  {
    severity: 'moderate',
    title: 'Winter Weather Advisory',
    expiration: now + 3 * 60 * 60, // now + 3 hours
    description: (
      <>
        <p>* WHAT...Snow expected. Total snow accumulations of 6 to 12 inches. Winds gusting as high as 45 mph.</p>
        <p>* WHERE...Eastern Alaska Range.</p>
        <p>* WHEN...From 9 PM this evening to 9 PM AKST Thursday.</p>
        <p>
          * IMPACTS...Travel could be very difficult. Areas of blowing snow could significantly reduce visibility
          especially south of Trims Camp. The cold wind chills as low as 25 below zero could cause frostbite on exposed
          skin in as little as 30 minutes.
        </p>
        <p>* ADDITIONAL DETAILS...Low visibility in snow and blowing snow expected south of Trims Camp.</p>
        <p>Slow down and use caution while traveling. The latest road conditions can be obtained by calling 5 1 1.</p>
      </>
    )
  },
  {
    severity: 'minor',
    title: 'Small Craft Advisory',
    expiration: now + 4 * 24 * 60 * 60, // now + 4 days
    description: (
      <>
        <p>.TODAY...Variable wind less than 10 kt becoming E 10 kt in the afternoon. Seas 2 ft. Rain and snow.</p>
        <p>.TONIGHT...E wind 10 kt becoming W 15 kt after midnight. Seas 2 ft. Snow and rain.</p>
        <p>
          .WED...W wind 20 kt increasing to 30 kt in the afternoon. Gusts to 30 kt increasing to 40 kt in the afternoon,
          strongest near Whittier. Seas 4 ft. Snow.
        </p>
        <p>.WED NIGHT...W wind 30 kt. Seas 5 ft.</p>
        <p>.THU...W wind 30 kt. Seas 5 ft.</p>
        <p>.FRI...W wind 20 kt. Seas 3 ft.</p>
        <p>.SAT...W wind 10 kt. Seas 2 ft.</p>
      </>
    )
  }
];

export default function Main({ queryParams, children }: { queryParams: QueryParams; children?: ReactNode }) {
  const isOnline = useOnlineStatus();
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
      {children != null ? (
        children
      ) : !isOnline && observationsIsError && forecastIsError ? (
        <OfflineError></OfflineError>
      ) : (
        <>
          {MOCK_ALERTS.map((mockAlert, i) => (
            <AlertCard key={i} {...mockAlert}></AlertCard>
          ))}
          <ObservationsCard
            isLoading={observationsIsLoading}
            latestReadTime={observations?.latestReadTime ? observations!.latestReadTime! : undefined}
            observations={observations?.data}
          ></ObservationsCard>
          <ForecastCards
            isLoading={forecastIsLoading}
            latestReadTime={forecast?.latestReadTime ? forecast!.latestReadTime! : undefined}
            forecasts={forecast?.data?.nws?.forecasts?.length ? forecast!.data!.nws!.forecasts! : placeholderForecasts}
          ></ForecastCards>
        </>
      )}
    </main>
  );
}
