import TimeAgo from 'react-timeago';
import { getTimeAgoFormatter } from 'helpers';

import styles from './CardHeader.module.css';

export default function CardHeaderContents({
  isLoading,
  lastUpdatedTime,
  label,
  secondaryLabel
}: {
  isLoading?: boolean;
  lastUpdatedTime?: number;
  label: string;
  secondaryLabel?: string;
}) {
  return (
    <div className={styles['card-header__contents']}>
      <h2
        aria-label={`${label}${secondaryLabel ? ` ${secondaryLabel}` : ''}`}
        className={styles['card-header__contents__title']}
      >
        {label}
        {secondaryLabel != null ? (
          <>
            {' '}
            <span>{secondaryLabel}</span>
          </>
        ) : (
          <></>
        )}
      </h2>
      <p className={styles['card-header__contents__label']}>
        {isLoading ? (
          <>Updating...</>
        ) : lastUpdatedTime ? (
          <>
            Updated{' '}
            {
              <TimeAgo
                date={lastUpdatedTime * 1_000}
                formatter={getTimeAgoFormatter({ exclude: 'future', useJustNow: true })}
              />
            }
          </>
        ) : (
          <>Update failed</>
        )}
      </p>
    </div>
  );
}
