import { Fragment, useEffect, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { UI_ANIMATION_DURATION } from 'constants/client';
import { useShouldContinueRendering } from 'hooks';
import { NwsAlert } from 'models/api';
import AlertCardHeader from '../CardHeader/AlertCardHeader';
import baseStyles from '../Card.module.css';
import styles from './AlertCard.module.css';

const ANIMATED_CONTENTS_WRAPPER_ID = 'AlertCardAccordianContentsWrapper';

export default function AlertCard({ alert, _key }: { alert: NwsAlert; _key: string }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const shouldContinueRendering = useShouldContinueRendering(isExpanded);

  const [animatedContentsWrapperId, setAnimatedContentsWrapperId] = useState<string>(ANIMATED_CONTENTS_WRAPPER_ID);
  useEffect(() => setAnimatedContentsWrapperId(`${ANIMATED_CONTENTS_WRAPPER_ID}-${_key}`), [_key]);

  return (
    <article className={baseStyles.card}>
      <AlertCardHeader
        alert={alert}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        ariaControls={animatedContentsWrapperId}
      ></AlertCardHeader>
      <AnimateHeight id={animatedContentsWrapperId} duration={UI_ANIMATION_DURATION} height={isExpanded ? 'auto' : 0}>
        {isExpanded || shouldContinueRendering ? (
          <div className={styles['alert-card-content']}>
            {alert.description.map((descItem, idx) => (
              <Fragment key={idx}>
                {descItem.heading ? (
                  <h3 key={`${idx}Heading`} className={styles['alert-card-content__description-heading']}>
                    {descItem.heading}
                  </h3>
                ) : (
                  <></>
                )}
                <p key={`${idx}Body`} className={styles['alert-card-content__description-body']}>
                  {descItem.body}
                </p>
              </Fragment>
            ))}
            {alert.instruction.length ? (
              <p className={styles['alert-card-content__instructions']}>{alert.instruction.join(' ')}</p>
            ) : (
              <></>
            )}
          </div>
        ) : (
          <></>
        )}
      </AnimateHeight>
    </article>
  );
}
