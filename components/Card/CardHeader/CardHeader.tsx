import { CSSProperties, Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react';
import { ArrowIcon } from 'components/Icons/ArrowIcon';
import { Color } from 'models/color.enum';

import styles from './CardHeader.module.css';

export function CardHeader({
  preContents,
  contents,
  backgroundColor,
  foregroundColor,
  roundBottomCornersWhenCollapsed,
  isExpanded,
  setIsExpanded,
  ariaControls,
  disabledExpand
}: {
  preContents?: ReactNode;
  contents: ReactNode;
  backgroundColor: Color;
  foregroundColor: Color;
  roundBottomCornersWhenCollapsed?: boolean;
  isExpanded?: boolean;
  setIsExpanded?: Dispatch<SetStateAction<boolean>>;
  ariaControls?: string;
  disabledExpand?: boolean;
}) {
  const [canExpand, setCanExpand] = useState<boolean>(false);
  useEffect(
    () => setCanExpand(isExpanded != null && setIsExpanded != null && Boolean(ariaControls)),
    [isExpanded, setIsExpanded, ariaControls]
  );

  const style = {
    '--card-background-color': `var(--${backgroundColor})`,
    '--card-foreground-color': `var(--${foregroundColor})`
  } as CSSProperties;

  return canExpand ? (
    <button
      aria-controls={ariaControls!}
      aria-expanded={isExpanded!}
      className={`${styles['card-header']} ${
        roundBottomCornersWhenCollapsed ? styles['card-header--rounded-bottom-corners'] : ''
      } ${isExpanded ? styles['card-header--expanded'] : ''} animated`}
      disabled={disabledExpand ? disabledExpand : undefined}
      onClick={e => {
        e.preventDefault();
        setIsExpanded!(!isExpanded!);
      }}
      style={style}
    >
      {preContents}
      {contents}
      {disabledExpand ? undefined : (
        <ArrowIcon animationState={isExpanded ? 'end' : 'start'} fillColor={foregroundColor} />
      )}
    </button>
  ) : (
    <header className={styles['card-header']} style={style}>
      {preContents}
      {contents}
    </header>
  );
}
