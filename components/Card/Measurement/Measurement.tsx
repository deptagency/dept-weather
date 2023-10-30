import { ReactElement } from 'react';

import styles from './Measurement.module.css';

export default function Measurement({
  value,
  secondaryValue,
  icon,
  label
}: {
  value?: string | number | ReactElement;
  secondaryValue?: string | number;
  icon?: ReactElement;
  label?: string;
}) {
  return (
    <div className={styles.measurement}>
      <div className={styles.measurement__description}>
        {icon}
        <p className={styles.measurement__description__label}>{label}</p>
      </div>
      <div>
        <p className={styles.measurement__value}>{value}</p>
        {secondaryValue ? <p className={styles['measurement__secondary-value']}>{secondaryValue}</p> : <></>}
      </div>
    </div>
  );
}
