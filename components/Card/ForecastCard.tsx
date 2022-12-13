import { NwsPeriod } from 'models/api';
import CardHeader from './CardHeader/CardHeader';
import SummaryForecast from './SummaryForecast/SummaryForecast';
import ForecastTemps from './ForecastTemps/ForecastTemps';
import styles from './Card.module.css';

export default function ForecastCard({
  isLoading,
  latestReadTime,
  period
}: {
  isLoading?: boolean;
  latestReadTime?: number;
  period: NwsPeriod;
}) {
  return (
    <article className={styles.card}>
      <CardHeader
        isLoading={isLoading}
        lastUpdatedTime={latestReadTime}
        label={period.dayName}
        secondaryLabel={period.shortDateName}
        useIndigo={false}
      ></CardHeader>
      <div className={styles['card-contents']}>
        <div className={`${styles['card-contents__overview']} ${styles['card-contents__overview--forecast']}`}>
          <ForecastTemps
            highTemperature={period.dayForecast?.temperature}
            lowTemperature={period.nightForecast?.temperature}
          ></ForecastTemps>
        </div>
        <div className={styles['card-contents__forecasts']}>
          <SummaryForecast isDaytime={true} forecast={period.dayForecast}></SummaryForecast>
          <SummaryForecast isDaytime={false} forecast={period.nightForecast}></SummaryForecast>
        </div>
      </div>
    </article>
  );
}
