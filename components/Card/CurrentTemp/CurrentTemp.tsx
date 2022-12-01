import { WeatherObservations } from 'models/api';
import { floorOrEmDash, roundOrEmDash } from 'utils';
import styles from './CurrentTemp.module.css';

export default function CurrentTemp({ observations }: { observations?: WeatherObservations }) {
  const fractionalTemp = observations?.temperature != null ? (observations.temperature * 10) % 10 : 0;
  return (
    <>
      <h3 className={styles['current-temp__temp']}>
        <span>{floorOrEmDash(observations?.temperature)}</span>
        {fractionalTemp ? <span className={styles['current-temp__temp__decimal']}>{`.${fractionalTemp}`}</span> : <></>}
        <span className={fractionalTemp ? styles['current-temp__temp__degree-symbol--fractional'] : ''}>°</span>
      </h3>
      <p className={styles['current-temp__feels-like']}>Feels Like {roundOrEmDash(observations?.feelsLike)}°</p>
    </>
  );
}
