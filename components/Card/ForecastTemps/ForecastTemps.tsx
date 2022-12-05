import { useEffect, useState } from 'react';
import { roundOrEmDash } from 'utils';
import styles from './ForecastTemps.module.css';

export default function ForecastTemps({
  highTemperature,
  lowTemperature
}: {
  highTemperature?: number | null | undefined;
  lowTemperature?: number | null | undefined;
}) {
  const [highTempTxt, setHighTempTxt] = useState<string>('');
  const [lowTempText, setLowTempTxt] = useState<string>('');
  const [ariaLabel, setAriaLabel] = useState<string>('');

  useEffect(() => {
    const newHighTempTxt = `${roundOrEmDash(highTemperature)}°`;
    const newLowTempTxt = `${roundOrEmDash(lowTemperature)}°`;
    const newAriaLabel = `High: ${newHighTempTxt}. Low: ${newLowTempTxt}`;

    setHighTempTxt(newHighTempTxt);
    setLowTempTxt(newLowTempTxt);
    setAriaLabel(newAriaLabel);
  }, [highTemperature, lowTemperature]);

  return (
    <h3 className={styles['forecast-temps__temps']} aria-label={ariaLabel}>
      <span className={styles['forecast-temps__temps__high']} aria-hidden={true}>
        {highTempTxt}
      </span>
      <span className={styles['forecast-temps__temps__low']} aria-hidden={true}>
        /{lowTempText}
      </span>
    </h3>
  );
}
