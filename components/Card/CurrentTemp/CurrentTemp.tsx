import { Observations, Response } from '../../../models/api';
import styles from './CurrentTemp.module.css';

export default function CurrentTemp({ observations }: { observations: Response<Observations> }) {
  return (
    <>
      <h3 className={styles['current-temp__temp']}>
        <span>{observations.data.wl?.temperature != null ? Math.floor(observations.data.wl.temperature) : '–'}</span>
        <span className={styles['current-temp__temp__decimal']}>
          {observations.data.wl?.temperature != null ? `.${(observations.data.wl.temperature * 10) % 10}` : ''}
        </span>
        <span className={styles['current-temp__temp__degree-symbol']}>°</span>
      </h3>
      {observations.data.wl?.feelsLike ? (
        <p className={styles['current-temp__feels-like']}>Feels Like {Math.round(observations.data.wl.feelsLike)}°</p>
      ) : (
        <></>
      )}
    </>
  );
}
