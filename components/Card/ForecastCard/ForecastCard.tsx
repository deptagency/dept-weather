import { NwsForecastPeriod } from '../../../models/api';
import CardHeader from '../CardHeader/CardHeader';
import ForecastPeriod from '../ForecastPeriod/ForecastPeriod';
import ForecastTemps from '../ForecastTemps/ForecastTemps';
import styles from './ForecastCard.module.css';

export default function ForecastCard({
  dayForecast,
  nightForecast,
  latestReadTime
}: {
  dayForecast?: NwsForecastPeriod;
  nightForecast?: NwsForecastPeriod;
  latestReadTime: number;
}) {
  return (
    <article className={styles.card}>
      <CardHeader
        lastUpdatedTime={latestReadTime * 1_000}
        label={(dayForecast?.dayName ?? nightForecast?.dayName ?? '').toUpperCase()}
        secondaryLabel={(dayForecast?.shortDateName ?? nightForecast?.shortDateName ?? '').toUpperCase()}
        useIndigo={false}
      ></CardHeader>
      <div className={styles['card-contents']}>
        <div className={styles['card-contents__overview']}>
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
