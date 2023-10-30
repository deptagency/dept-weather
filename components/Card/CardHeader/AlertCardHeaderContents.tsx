import { useEffect, useState } from 'react';
import { NwsAlert } from 'models/api';

import styles from './CardHeader.module.css';

const TimeLabel = ({ alert }: { alert: NwsAlert }) => {
  const [now, setNow] = useState<number>(new Date().getTime() / 1_000);
  useEffect(() => {
    // Update "now" every 5 seconds
    const nowTimer = setInterval(() => setNow(new Date().getTime() / 1_000), 5_000);
    return () => clearInterval(nowTimer);
  }, []);

  const [showOnset, setShowOnset] = useState<boolean>(false);
  useEffect(() => setShowOnset(now < alert.onset), [now, alert.onset]);

  return (
    <p className={styles['card-header__contents__label']}>
      {showOnset ? (
        <>
          {'From '}
          <time dateTime={alert.onsetIsoTz}>{`${alert.onsetLabel}${
            alert.onsetShortTz !== alert.endsShortTz ? ` ${alert.onsetShortTz}` : ''
          }`}</time>
          {' to '}
        </>
      ) : (
        <>Until </>
      )}
      <time dateTime={alert.endsIsoTz}>{`${alert.endsLabel} ${alert.endsShortTz}`}</time>
    </p>
  );
};

export default function AlertCardHeaderContents({ alert }: { alert: NwsAlert }) {
  return (
    <div className={styles['card-header__contents']}>
      <h2 className={styles['card-header__contents__title']}>{alert.title}</h2>
      <TimeLabel alert={alert} />
    </div>
  );
}
