import { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react';
import { AlertCardHeaderContents } from 'components/Card/CardHeader/AlertCardHeaderContents';
import { CardHeader } from 'components/Card/CardHeader/CardHeader';
import { AlertCircleIcon } from 'components/Icons/AlertCircleIcon';
import { AlertDiamondIcon } from 'components/Icons/AlertDiamondIcon';
import { AlertHexagonIcon } from 'components/Icons/AlertHexagonIcon';
import { AlertTriangleIcon } from 'components/Icons/AlertTriangleIcon';
import { WithCustomizableFillColor } from 'components/Icons/iconStyle';
import { NwsAlert } from 'models/api/alerts.model';
import { Color } from 'models/color.enum';
import { AlertSeverity } from 'models/nws/alerts.model';

import styles from './CardHeader.module.css';

export function AlertCardHeader({
  alert,
  isExpanded,
  setIsExpanded,
  ariaControls
}: {
  alert: NwsAlert;
  isExpanded?: boolean;
  setIsExpanded?: Dispatch<SetStateAction<boolean>>;
  ariaControls?: string;
}) {
  const [alertIcon, setAlertIcon] = useState<ReactElement>(<></>);
  useEffect(() => {
    let newAlertIconType: (props: WithCustomizableFillColor) => ReactElement;
    if (alert.severity === AlertSeverity.EXTREME) newAlertIconType = AlertHexagonIcon;
    else if (alert.severity === AlertSeverity.SEVERE) newAlertIconType = AlertDiamondIcon;
    else if (alert.severity === AlertSeverity.MODERATE) newAlertIconType = AlertTriangleIcon;
    else newAlertIconType = AlertCircleIcon;

    setAlertIcon(newAlertIconType({ fillColor: Color.WHITE }));
  }, [alert.severity]);

  return (
    <CardHeader
      ariaControls={ariaControls}
      backgroundColor={`alert-${alert.severity.toLowerCase()}` as Color}
      contents={<AlertCardHeaderContents alert={alert} />}
      foregroundColor={Color.WHITE}
      isExpanded={isExpanded}
      preContents={<div className={styles['card-header__pre-icon']}>{alertIcon}</div>}
      roundBottomCornersWhenCollapsed={true}
      setIsExpanded={setIsExpanded}
    />
  );
}
