import TimeAgo, { Formatter, Suffix, Unit as TimeAgoUnit } from 'react-timeago';
import styles from './CardHeader.module.css';

const timeAgoFormatter = ((
  value: number,
  unit: TimeAgoUnit,
  suffix: Suffix,
  epochMiliseconds: number,
  nextFormatter: Formatter
) => {
  if (suffix === 'from now' || (unit === 'second' && value < 30)) {
    return <>just now</>;
  } else if ((unit === 'second' && value >= 30) || (unit === 'minute' && value < 2)) {
    return <>a moment {suffix}</>;
  }
  return nextFormatter(value, unit, suffix, epochMiliseconds);
}) as Formatter;

export default function CardHeader({
  lastUpdatedTime,
  label,
  secondaryLabel,
  useIndigo
}: {
  lastUpdatedTime: number;
  label: string;
  secondaryLabel?: string;
  useIndigo?: boolean;
}) {
  return (
    <header
      className={`${styles['card-header']} ${useIndigo ? styles['card-header--indigo'] : styles['card-header--onyx']}`}
    >
      <h2 className={styles['card-header__title']}>
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
        Updated {<TimeAgo date={lastUpdatedTime * 1_000} formatter={timeAgoFormatter} />}
      </p>
    </header>
  );
}
