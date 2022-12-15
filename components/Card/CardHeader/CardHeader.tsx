import { ArrowIcon } from 'components/Icons';
import { getTimeAgoFormatter } from 'helpers';
import { Color } from 'models';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import TimeAgo from 'react-timeago';
import styles from './CardHeader.module.css';

const CardHeaderContents = ({
  isLoading,
  lastUpdatedTime,
  label,
  secondaryLabel
}: {
  isLoading?: boolean;
  lastUpdatedTime?: number;
  label: string;
  secondaryLabel?: string;
}) => (
  <div className={styles['card-header__contents']}>
    <h2
      className={styles['card-header__contents__title']}
      aria-label={`${label}${secondaryLabel ? ` ${secondaryLabel}` : ''}`}
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
    <p className={styles['card-header__contents__last-updated']}>
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

export default function CardHeader({
  isLoading,
  lastUpdatedTime,
  label,
  secondaryLabel,
  backgroundColor,
  isExpanded,
  setIsExpanded,
  ariaControls
}: {
  isLoading?: boolean;
  lastUpdatedTime?: number;
  label: string;
  secondaryLabel?: string;
  backgroundColor: Color;
  isExpanded?: boolean;
  setIsExpanded?: Dispatch<SetStateAction<boolean>>;
  ariaControls?: string;
}) {
  const [canExpand, setCanExpand] = useState<boolean>(false);
  useEffect(
    () => setCanExpand(isExpanded != null && setIsExpanded != null && Boolean(ariaControls)),
    [isExpanded, setIsExpanded, ariaControls]
  );

  const [contents, setContents] = useState(<></>);
  useEffect(
    () =>
      setContents(
        <CardHeaderContents
          isLoading={isLoading}
          lastUpdatedTime={lastUpdatedTime}
          label={label}
          secondaryLabel={secondaryLabel}
        ></CardHeaderContents>
      ),
    [isLoading, lastUpdatedTime, label, secondaryLabel, canExpand, isExpanded]
  );

  return canExpand ? (
    <button
      className={`${styles['card-header']} animated`}
      style={{ '--card-background-color': `var(--${backgroundColor})` } as React.CSSProperties}
      onClick={e => {
        e.preventDefault();
        setIsExpanded!(!isExpanded!);
      }}
      aria-expanded={isExpanded!}
      aria-controls={ariaControls!}
    >
      {contents}
      {<ArrowIcon useInverseFill={true} animationState={isExpanded ? 'end' : 'start'}></ArrowIcon>}
    </button>
  ) : (
    <header
      className={styles['card-header']}
      style={{ '--card-background-color': `var(--${backgroundColor})` } as React.CSSProperties}
    >
      {contents}
    </header>
  );
}
