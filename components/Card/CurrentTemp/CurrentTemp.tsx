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

    const queryNotificationsPermission = async () => {
      if ('permissions' in navigator) {
        let permissionState: PermissionState | NotificationPermission;
        const permissionStatus = await navigator.permissions.query({ name: 'notifications' });
        permissionState = permissionStatus.state;

        if (permissionStatus.state === 'prompt') {
          permissionState = await Notification.requestPermission();
        }
        if (permissionState === 'granted' && 'setAppBadge' in window.navigator) {
          (window.navigator as any).setAppBadge(
            observations?.temperature != null ? Math.round(observations?.temperature) : 0
          );
        }
      }
    };
    queryNotificationsPermission();
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
