import { useEffect, useState } from 'react';
import { WeatherObservations } from 'models/api/observations.model';
import { floorOrEmDash, roundOrEmDash } from 'utils';

import styles from './CurrentTemp.module.css';

export function CurrentTemp({ observations }: { observations?: WeatherObservations }) {
  const [tempDisplayTxt, setTempDisplayTxt] = useState<string>('');
  const [fractionalTemp, setFractionalTemp] = useState<string>('');
  const [tempAriaLabel, setTempAriaLabel] = useState<string>('');
  const [feelsLikeTxt, setFeelsLikeTxt] = useState<string>('');

  useEffect(() => {
    const newTemp = floorOrEmDash(observations?.temperature);
    const newFractionalTemp = observations?.temperature != null ? Math.abs((observations.temperature * 10) % 10) : '';
    let newTempAriaLabel = String(newTemp);
    if (newFractionalTemp) {
      newTempAriaLabel += `.${newFractionalTemp}`;
    }
    newTempAriaLabel += '°';
    const newFeelsLikeTxt = `Feels Like ${roundOrEmDash(observations?.feelsLike)}°`;

    setTempDisplayTxt(String(newTemp));
    setFractionalTemp(String(newFractionalTemp));
    setTempAriaLabel(newTempAriaLabel);
    setFeelsLikeTxt(newFeelsLikeTxt);
  }, [observations]);

  return (
    <>
      <h3 aria-label={tempAriaLabel} className={styles['current-temp__temp']}>
        <span aria-hidden={true}>{tempDisplayTxt}</span>
        {fractionalTemp ? (
          <span aria-hidden={true} className={styles['current-temp__temp__decimal']}>{`.${fractionalTemp}`}</span>
        ) : (
          <></>
        )}
        <span
          aria-hidden={true}
          className={fractionalTemp ? styles['current-temp__temp__degree-symbol--fractional'] : ''}
        >
          °
        </span>
      </h3>
      <p aria-label={feelsLikeTxt} className={styles['current-temp__feels-like']}>
        {feelsLikeTxt}
      </p>
    </>
  );
}
