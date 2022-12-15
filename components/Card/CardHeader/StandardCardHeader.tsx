import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Color } from 'models';
import CardHeader from './CardHeader';
import StandardCardHeaderContents from './StandardCardHeaderContents';

export default function StandardCardHeader({
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
  const [contents, setContents] = useState(<></>);
  useEffect(
    () =>
      setContents(
        <StandardCardHeaderContents
          isLoading={isLoading}
          lastUpdatedTime={lastUpdatedTime}
          label={label}
          secondaryLabel={secondaryLabel}
        ></StandardCardHeaderContents>
      ),
    [isLoading, lastUpdatedTime, label, secondaryLabel]
  );

  return (
    <CardHeader
      contents={contents}
      backgroundColor={backgroundColor}
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
      ariaControls={ariaControls}
    ></CardHeader>
  );
}
