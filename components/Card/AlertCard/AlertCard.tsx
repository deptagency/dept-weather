import { Fragment, ReactElement, ReactNode, useEffect, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import TimeAgo from 'react-timeago';
import { AlertCircleIcon, AlertDiamondIcon, AlertHexagonIcon, AlertTriangleIcon, ArrowIcon } from 'components/Icons';
import baseStyles from '../Card.module.css';
import styles from './AlertCard.module.css';
import { NwsAlert } from 'models/api';
import { AlertSeverity } from 'models/nws/alerts.model';
import { getTimeAgoFormatter } from 'helpers';

const ANIMATED_CONTENTS_WRAPPER_ID = 'AlertCardAccordianContentsWrapper';

const TimeAgoLabel = ({ effective, expires }: Pick<NwsAlert, 'effective' | 'expires'>) => {
  const useEffective = effective > new Date().getTime() / 1_000;
  return (
    <p className={styles['alert-card-accordian__header__expiration']}>
      {useEffective ? 'Effective ' : 'Expires '}
      {
        <TimeAgo
          date={(useEffective ? effective : expires) * 1_000}
          formatter={getTimeAgoFormatter({ exclude: 'past', useJustNow: false })}
        />
      }
    </p>
  );
};

export default function AlertCard({ alert }: { alert: NwsAlert }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const [alertIcon, setAlertIcon] = useState<ReactNode>(<></>);
  useEffect(() => {
    let newAlertIconType: (props: { useInverseFill?: boolean | undefined }) => ReactElement;
    if (alert.severity === AlertSeverity.EXTREME) newAlertIconType = AlertHexagonIcon;
    else if (alert.severity === AlertSeverity.SEVERE) newAlertIconType = AlertDiamondIcon;
    else if (alert.severity === AlertSeverity.MODERATE) newAlertIconType = AlertTriangleIcon;
    else newAlertIconType = AlertCircleIcon;

    setAlertIcon(newAlertIconType({ useInverseFill: true }));
  }, [alert.severity]);

  // TODO - show effective & expiration timestamps and senderName
  return (
    <article className={baseStyles.card}>
      <button
        className={`animated ${styles['alert-card-accordian']} ${
          styles[`alert-card-accordian--${alert.severity.toLowerCase()}`]
        } ${isExpanded ? styles['alert-card-accordian--expanded'] : ''}`}
        onClick={e => {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }}
        aria-expanded={isExpanded}
        aria-controls={ANIMATED_CONTENTS_WRAPPER_ID}
      >
        <div className={styles['alert-card-accordian__alert-icon']}>{alertIcon}</div>
        <div className={`${styles['alert-card-accordian__header']}`}>
          <h2 className={styles['alert-card-accordian__header__title']}>{alert.title}</h2>
          <TimeAgoLabel effective={alert.effective} expires={alert.expires}></TimeAgoLabel>
        </div>
        <ArrowIcon useInverseFill={true} animationState={isExpanded ? 'end' : 'start'}></ArrowIcon>
      </button>
      <AnimateHeight id={ANIMATED_CONTENTS_WRAPPER_ID} duration={300} height={isExpanded ? 'auto' : 0}>
        <div className={styles['alert-card-accordian__content']}>
          {alert.description.map((descItem, idx) => (
            <Fragment key={idx}>
              {descItem.heading ? (
                <h3 key={`${idx}Heading`} className={styles['alert-card-accordian__content__description-heading']}>
                  {descItem.heading}
                </h3>
              ) : (
                <></>
              )}
              <p key={`${idx}Body`} className={styles['alert-card-accordian__content__description-body']}>
                {descItem.body}
              </p>
            </Fragment>
          ))}
          {alert.instruction ? (
            <p className={styles['alert-card-accordian__content__instructions']}>{alert.instruction.join(' ')}</p>
          ) : (
            <></>
          )}
        </div>
      </AnimateHeight>
    </article>
  );
}
