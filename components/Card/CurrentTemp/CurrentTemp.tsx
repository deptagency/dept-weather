import { WeatherObservations } from 'models/api';
import { useEffect, useState } from 'react';
import { floorOrEmDash, roundOrEmDash } from 'utils';
import styles from './CurrentTemp.module.css';

export default function CurrentTemp({ observations }: { observations?: WeatherObservations }) {
  const [tempDisplayTxt, setTempDisplayTxt] = useState<string>('');
  const [fractionalTemp, setFractionalTemp] = useState<string>('');
  const [tempAriaLabel, setTempAriaLabel] = useState<string>('');
  const [feelsLikeTxt, setFeelsLikeTxt] = useState<string>('');

  useEffect(() => {
    console.log(observations?.temperature);
    const newTemp = floorOrEmDash(observations?.temperature);
    const newFractionalTemp = observations?.temperature != null ? (observations.temperature * 10) % 10 : '';
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
      <h3 className={styles['current-temp__temp']} aria-label={tempAriaLabel}>
        <span aria-hidden={true}>{tempDisplayTxt}</span>
        {fractionalTemp ? (
          <span className={styles['current-temp__temp__decimal']} aria-hidden={true}>{`.${fractionalTemp}`}</span>
        ) : (
          <></>
        )}
        <span
          className={fractionalTemp ? styles['current-temp__temp__degree-symbol--fractional'] : ''}
          aria-hidden={true}
        >
          °
        </span>
      </h3>
      <p className={styles['current-temp__feels-like']} aria-label={feelsLikeTxt}>
        {feelsLikeTxt}
      </p>
    </>
  );
}
