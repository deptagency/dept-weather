import { Fragment, useEffect, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { AlertCardHeader } from 'components/Card/CardHeader/AlertCardHeader';
import { UI_ANIMATION_DURATION } from 'constants/client';
import { useShouldContinueRendering } from 'hooks/use-should-continue-rendering';
import { NwsAlert } from 'models/api/alerts.model';

import baseStyles from '../Card.module.css';
import styles from './AlertCard.module.css';

const ANIMATED_CONTENTS_WRAPPER_ID = 'AlertCardAccordianContentsWrapper';

export function AlertCard({
  alert,
  isExpandedByUrl,
  _key
}: {
  alert: NwsAlert;
  isExpandedByUrl: boolean;
  _key: string;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(isExpandedByUrl);
  const shouldContinueRendering = useShouldContinueRendering(isExpanded);

  const [animatedContentsWrapperId, setAnimatedContentsWrapperId] = useState<string>(ANIMATED_CONTENTS_WRAPPER_ID);
  useEffect(() => setAnimatedContentsWrapperId(`${ANIMATED_CONTENTS_WRAPPER_ID}-${_key}`), [_key]);

  return (
    <article className={baseStyles.card}>
      <AlertCardHeader
        alert={alert}
        ariaControls={animatedContentsWrapperId}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      <AnimateHeight duration={UI_ANIMATION_DURATION} height={isExpanded ? 'auto' : 0} id={animatedContentsWrapperId}>
        {isExpanded || shouldContinueRendering ? (
          <div className={styles['alert-card-content']}>
            {alert.description.map((descItem, idx) => (
              <Fragment key={idx}>
                {descItem.heading ? (
                  <h3 className={styles['alert-card-content__description-heading']} key={`${idx}Heading`}>
                    {descItem.heading}
                  </h3>
                ) : (
                  <></>
                )}
                <p className={styles['alert-card-content__description-body']} key={`${idx}Body`}>
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
