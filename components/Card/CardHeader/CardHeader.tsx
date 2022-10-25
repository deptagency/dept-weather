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

export default function CardHeader({ lastUpdatedTime }: { lastUpdatedTime: number }) {
  return (
    <header className={`${styles['card-header']} ${styles['card-header--now']}`}>
      <h2 className={styles['card-header__title']}>NOW</h2>
      <p className={styles['card-header__last-updated']}>
        Updated {<TimeAgo date={lastUpdatedTime} formatter={timeAgoFormatter} />}
      </p>
    </header>
  );
}
