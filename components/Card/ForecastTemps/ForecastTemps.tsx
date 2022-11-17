import { roundOrEmDash } from 'utils';
import styles from './ForecastTemps.module.css';

export default function ForecastTemps({
  highTemperature,
  lowTemperature
}: {
  highTemperature?: number | null | undefined;
  lowTemperature?: number | null | undefined;
}) {
  return (
    <h3 className={styles['forecast-temps__temps']}>
      <span className={styles['forecast-temps__temps__high']}>{roundOrEmDash(highTemperature)}°</span>
      <span className={styles['forecast-temps__temps__low']}>/{roundOrEmDash(lowTemperature)}°</span>
    </h3>
  );
}
