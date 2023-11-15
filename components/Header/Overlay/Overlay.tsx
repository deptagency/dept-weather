import { ComponentPropsWithoutRef } from 'react';
import { OverlayProps } from 'components/Header/Overlay/Overlay.types';

import styles from './Overlay.module.css';

export function Overlay({
  children,
  innerClassName,
  showOverlay,
  closeOverlay
}: Pick<ComponentPropsWithoutRef<'div'>, 'children'> & { innerClassName?: string } & OverlayProps) {
  return (
    <div
      className={`animated ${styles['overlay']} ${
        showOverlay ? styles['overlay--visible'] : styles['overlay--hidden']
      }`}
      onClick={e => {
        if (!e.defaultPrevented && closeOverlay != null) {
          closeOverlay();
        }
      }}
    >
      <div className={`${styles.overlay__inner} ${innerClassName ?? ''}`}>{children}</div>
    </div>
  );
}
