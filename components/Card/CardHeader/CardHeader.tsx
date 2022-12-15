import { getTimeAgoFormatter } from 'helpers';
import { Color } from 'models';
import TimeAgo from 'react-timeago';
import styles from './CardHeader.module.css';

export default function CardHeader({
  isLoading,
  lastUpdatedTime,
  label,
  secondaryLabel,
  backgroundColor
}: {
  isLoading?: boolean;
  lastUpdatedTime?: number;
  label: string;
  secondaryLabel?: string;
  backgroundColor: Color;
}) {
  return (
    <header
      className={styles['card-header']}
      style={{ '--card-background-color': `var(--${backgroundColor})` } as React.CSSProperties}
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
