import { Overlay } from 'components/Header/Overlay/Overlay';
import { SettingsOverlayProps } from 'components/Header/SettingsOverlay/SettingsOverlay.types';

import styles from './SettingsOverlay.module.css';
import homeStyles from 'styles/Home.module.css';

export function SettingsOverlay({ showOverlay }: SettingsOverlayProps) {
  return (
    <Overlay
      innerClassName={`${styles['settings-overlay__inner']} ${homeStyles.container__content}`}
      showOverlay={showOverlay}
    >
      {/* TODO */}
      <h2>WIP</h2>
    </Overlay>
  );
}
