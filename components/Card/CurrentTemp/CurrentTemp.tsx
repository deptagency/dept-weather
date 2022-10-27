import { floorOrEmDash } from '../../../utils';
import styles from './CurrentTemp.module.css';

export default function CurrentTemp({
  temperature,
  feelsLike
}: {
  temperature?: number | null | undefined;
  feelsLike?: number | null | undefined;
}) {
  const fractionalTemp = temperature != null ? (temperature * 10) % 10 : 0;
  return (
    <>
      <h3 className={styles['current-temp__temp']}>
        <span>{floorOrEmDash(temperature)}</span>
        {fractionalTemp ? <span className={styles['current-temp__temp__decimal']}>{`.${fractionalTemp}`}</span> : <></>}
        <span className={fractionalTemp ? styles['current-temp__temp__degree-symbol--fractional'] : ''}>°</span>
      </h3>
      {feelsLike != null ? (
        <p className={styles['current-temp__feels-like']}>Feels Like {Math.round(feelsLike)}°</p>
      ) : (
        <></>
      )}
    </>
  );
}
