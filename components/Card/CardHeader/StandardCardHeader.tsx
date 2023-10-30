import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import CardHeader from 'components/Card/CardHeader/CardHeader';
import StandardCardHeaderContents from 'components/Card/CardHeader/StandardCardHeaderContents';
import { Color } from 'models';

export default function StandardCardHeader({
  isLoading,
  lastUpdatedTime,
  label,
  secondaryLabel,
  backgroundColor,
  isExpanded,
  setIsExpanded,
  ariaControls,
  disabledExpand
}: {
  isLoading?: boolean;
  lastUpdatedTime?: number;
  label: string;
  secondaryLabel?: string;
  backgroundColor: Color;
  isExpanded?: boolean;
  setIsExpanded?: Dispatch<SetStateAction<boolean>>;
  ariaControls?: string;
  disabledExpand?: boolean;
}) {
  const [contents, setContents] = useState(<></>);
  useEffect(
    () =>
      setContents(
        <StandardCardHeaderContents
          isLoading={isLoading}
          label={label}
          lastUpdatedTime={lastUpdatedTime}
          secondaryLabel={secondaryLabel}
        />
      ),
    [isLoading, lastUpdatedTime, label, secondaryLabel]
  );

  return (
    <CardHeader
      ariaControls={ariaControls}
      backgroundColor={backgroundColor}
      contents={contents}
      disabledExpand={disabledExpand}
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
    />
  );
}
