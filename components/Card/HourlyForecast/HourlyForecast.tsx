import { NwsHourlyPeriodForecast } from 'models/api';
import { roundOrEmDash } from 'utils';
import Condition from '../Condition/Condition';
import styles from './HourlyForecast.module.css';

export default function HourlyForecast({
  forecast,
  isDaytime
}: {
  forecast: NwsHourlyPeriodForecast;
  isDaytime: boolean;
}) {
  return (
    <div className={styles['hourly-forecast']}>
      <h5 className={styles['hourly-forecast__time-label']}>{forecast.startLabel}</h5>
      <Condition condition={forecast.condition} size="x-small" isNight={!isDaytime}></Condition>
      <p>{`${roundOrEmDash(forecast.temperature)}°`}</p>
      <p>{`${roundOrEmDash(forecast.chanceOfPrecip)}%`}</p>
      <p>{`${roundOrEmDash(forecast.humidity)}%`}</p>
      <p>{`${roundOrEmDash(forecast.wind.speed)}mph`}</p>
    </div>
  );
}
