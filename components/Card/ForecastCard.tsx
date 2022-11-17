import { NwsForecastPeriod } from 'models/api';
import CardHeader from './CardHeader/CardHeader';
import ForecastPeriod from './ForecastPeriod/ForecastPeriod';
import ForecastTemps from './ForecastTemps/ForecastTemps';
import styles from './Card.module.css';

export default function ForecastCard({
  isLoading,
  latestReadTime,
  dayForecast,
  nightForecast
}: {
  isLoading?: boolean;
  latestReadTime?: number;
  dayForecast?: NwsForecastPeriod;
  nightForecast?: NwsForecastPeriod;
}) {
  return (
    <article className={styles.card}>
      <CardHeader
        isLoading={isLoading}
        lastUpdatedTime={latestReadTime}
        label={(dayForecast?.dayName ?? nightForecast?.dayName ?? '').toUpperCase()}
        secondaryLabel={(dayForecast?.shortDateName ?? nightForecast?.shortDateName ?? '').toUpperCase()}
        useIndigo={false}
      ></CardHeader>
      <div className={styles['card-contents']}>
        <div className={`${styles['card-contents__overview']} ${styles['card-contents__overview--forecast']}`}>
          <ForecastTemps
            highTemperature={dayForecast?.temperature}
            lowTemperature={nightForecast?.temperature}
          ></ForecastTemps>
        </div>
        <div className={styles['card-contents__forecasts']}>
          <ForecastPeriod isDaytime={true} forecast={dayForecast}></ForecastPeriod>
          <ForecastPeriod isDaytime={false} forecast={nightForecast}></ForecastPeriod>
        </div>
      </div>
    </article>
  );
}
