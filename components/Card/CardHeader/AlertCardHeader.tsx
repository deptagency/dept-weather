import { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react';
import { AlertCircleIcon, AlertDiamondIcon, AlertHexagonIcon, AlertTriangleIcon, ArrowIcon } from 'components/Icons';
import { Color } from 'models';
import { NwsAlert } from 'models/api';
import { AlertSeverity } from 'models/nws';
import AlertCardHeaderContents from './AlertCardHeaderContents';
import CardHeader from './CardHeader';
import styles from './CardHeader.module.css';

export default function AlertCardHeader({
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
    let newAlertIconType: (props: { useInverseFill?: boolean | undefined }) => ReactElement;
    if (alert.severity === AlertSeverity.EXTREME) newAlertIconType = AlertHexagonIcon;
    else if (alert.severity === AlertSeverity.SEVERE) newAlertIconType = AlertDiamondIcon;
    else if (alert.severity === AlertSeverity.MODERATE) newAlertIconType = AlertTriangleIcon;
    else newAlertIconType = AlertCircleIcon;

    setAlertIcon(newAlertIconType({ useInverseFill: true }));
  }, [alert.severity]);

  return (
    <CardHeader
      preContents={<div className={styles['card-header__pre-icon']}>{alertIcon}</div>}
      contents={<AlertCardHeaderContents alert={alert}></AlertCardHeaderContents>}
      backgroundColor={`alert-${alert.severity.toLowerCase()}` as Color}
      roundBottomCornersWhenCollapsed={true}
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
      ariaControls={ariaControls}
    ></CardHeader>
  );
}
