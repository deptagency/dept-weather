import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react';
import { ArrowIcon } from 'components/Icons';
import { Color } from 'models';
import styles from './CardHeader.module.css';

export default function CardHeader({
  preContents,
  contents,
  backgroundColor,
  roundBottomCornersWhenCollapsed,
  isExpanded,
  setIsExpanded,
  ariaControls,
  disabledExpand
}: {
  preContents?: ReactNode;
  contents: ReactNode;
  backgroundColor: Color;
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

  return canExpand ? (
    <button
      className={`${styles['card-header']} ${
        roundBottomCornersWhenCollapsed ? styles['card-header--rounded-bottom-corners'] : ''
      } ${isExpanded ? styles['card-header--expanded'] : ''} animated`}
      style={{ '--card-background-color': `var(--${backgroundColor})` } as React.CSSProperties}
      onClick={e => {
        e.preventDefault();
        setIsExpanded!(!isExpanded!);
      }}
      aria-expanded={isExpanded!}
      aria-controls={ariaControls!}
      disabled={disabledExpand ? disabledExpand : undefined}
    >
      {preContents}
      {contents}
      {disabledExpand ? undefined : (
        <ArrowIcon useInverseFill={true} animationState={isExpanded ? 'end' : 'start'}></ArrowIcon>
      )}
    </button>
  ) : (
    <header
      className={styles['card-header']}
      style={{ '--card-background-color': `var(--${backgroundColor})` } as React.CSSProperties}
    >
      {preContents}
      {contents}
    </header>
  );
}
