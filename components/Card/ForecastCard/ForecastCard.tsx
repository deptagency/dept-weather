import { NwsForecastPeriod } from '../../../models/api';
import CardHeader from '../CardHeader/CardHeader';
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
        label={(dayForecast?.name ?? '').toUpperCase()}
        useIndigo={false}
      ></CardHeader>
      <div className={styles['card-contents']}>
        <div className={styles['card-contents__overview']}>
          <ForecastTemps
            highTemperature={dayForecast?.temperature}
            lowTemperature={nightForecast?.temperature}
          ></ForecastTemps>
        </div>
      </div>
    </article>
  );
}
