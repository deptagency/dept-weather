import { ReactNode, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import TimeAgo, { Formatter, Suffix, Unit as TimeAgoUnit } from 'react-timeago';
import { AlertCircleIcon, AlertDiamondIcon, AlertTriangleIcon, ArrowIcon } from 'components/Icons';
import baseStyles from '../Card.module.css';
import styles from './AlertCard.module.css';

const ANIMATED_CONTENTS_WRAPPER_ID = 'AlertCardAccordianContentsWrapper';

const timeAgoFormatter = ((
  value: number,
  unit: TimeAgoUnit,
  suffix: Suffix,
  epochMiliseconds: number,
  nextFormatter: Formatter
) => {
  if (unit === 'second' || (unit === 'minute' && value < 2)) {
    return <>a moment</>;
  } else if (unit === 'minute') {
    return <>{value}m</>;
  } else if (unit === 'hour') {
    return <>{value}hr</>;
  } else if (unit === 'day') {
    return <>{value}d</>;
  } else if (unit === 'week') {
    return <>{value}w</>;
  } else if (unit === 'month') {
    return <>{value}mo</>;
  } else if (unit === 'year') {
    return <>{value}yr</>;
  }
  return nextFormatter(value, unit, suffix, epochMiliseconds);
}) as Formatter;

export default function AlertCard({
  severity,
  title,
  expiration,
  description
}: {
  severity: string;
  title: string;
  expiration: number;
  description: ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <article className={baseStyles.card}>
      <button
        className={`animated ${styles['alert-card-accordian']} ${styles[`alert-card-accordian--${severity}`]} ${
          isExpanded ? styles['alert-card-accordian--expanded'] : ''
        }`}
        onClick={e => {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }}
        aria-expanded={isExpanded}
        aria-controls={ANIMATED_CONTENTS_WRAPPER_ID}
      >
        <div className={styles['alert-card-accordian__alert-icon']}>
          {severity === 'extreme' || severity === 'severe' ? (
            <AlertDiamondIcon useInverseFill={true}></AlertDiamondIcon>
          ) : severity === 'moderate' ? (
            <AlertTriangleIcon useInverseFill={true}></AlertTriangleIcon>
          ) : (
            <AlertCircleIcon useInverseFill={true}></AlertCircleIcon>
          )}
        </div>

        <div className={`${styles['alert-card-accordian__header']}`}>
          <h2 className={styles['alert-card-accordian__header__title']}>{title}</h2>
          <p className={styles['alert-card-accordian__header__expiration']}>
            Expires in {<TimeAgo date={expiration * 1_000} formatter={timeAgoFormatter} />}
          </p>
        </div>
        <ArrowIcon useInverseFill={true} animationState={isExpanded ? 'end' : 'start'}></ArrowIcon>
      </button>
      <AnimateHeight id={ANIMATED_CONTENTS_WRAPPER_ID} duration={300} height={isExpanded ? 'auto' : 0}>
        <div className={styles['alert-card-accordian__content']}>{description}</div>
      </AnimateHeight>
    </article>
  );
}
