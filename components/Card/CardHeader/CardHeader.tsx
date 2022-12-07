import { getTimeAgoFormatter } from 'helpers';
import TimeAgo from 'react-timeago';
import styles from './CardHeader.module.css';

export default function CardHeader({
  isLoading,
  lastUpdatedTime,
  label,
  secondaryLabel,
  useIndigo
}: {
  isLoading?: boolean;
  lastUpdatedTime?: number;
  label: string;
  secondaryLabel?: string;
  useIndigo?: boolean;
}) {
  return (
    <header
      className={`${styles['card-header']} ${useIndigo ? styles['card-header--indigo'] : styles['card-header--onyx']}`}
    >
      <h2 className={styles['card-header__title']} aria-label={`${label}${secondaryLabel ? ` ${secondaryLabel}` : ''}`}>
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
      <p className={styles['card-header__last-updated']}>
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
    </header>
  );
}
