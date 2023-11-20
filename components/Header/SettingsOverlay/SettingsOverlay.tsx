import { ComponentPropsWithoutRef } from 'react';
import { Overlay } from 'components/Header/Overlay/Overlay';
import { SettingsOverlayProps } from 'components/Header/SettingsOverlay/SettingsOverlay.types';

import styles from './SettingsOverlay.module.css';
import homeStyles from 'styles/Home.module.css';

const Radio = ({
  className,
  children,
  ...props
}: Omit<ComponentPropsWithoutRef<'input'>, 'type'> &
  Required<Pick<ComponentPropsWithoutRef<'input'>, 'name' | 'children'>>) => (
  <label className={`${styles['radio-label']} ${className ?? ''}`}>
    <input type="radio" {...props} />
    <span>{children}</span>
  </label>
);

export function SettingsOverlay({ showOverlay }: SettingsOverlayProps) {
  return (
    <Overlay innerClassName={`${styles.inner} ${homeStyles.container__content}`} showOverlay={showOverlay}>
      <div className={styles['sections-container']}>
        {/* TODO - WIP */}
        <fieldset>
          <legend className={styles.section__header}>Theme</legend>
          <div className={styles['section__radio-group']}>
            <Radio name="theme">Auto</Radio>
            <Radio name="theme">System</Radio>
            <Radio name="theme">Light</Radio>
            <Radio name="theme">Dark</Radio>
          </div>
        </fieldset>
        <fieldset>
          <legend className={styles.section__header}>Units</legend>
          <div className={`${styles.section__sub} ${styles['section__sub--units']}`}>
            <legend className={styles.section__sub__header}>Temperature</legend>
            <Radio name="temperature">°F</Radio>
            <Radio className={styles['section__sub__grid-col-end']} name="temperature">
              °C
            </Radio>
            <legend className={styles.section__sub__header}>Wind Speed</legend>
            <Radio name="windSpeed">miles</Radio>
            <Radio className={styles['section__sub__grid-col-end']} name="windSpeed">
              meters
            </Radio>
            <legend className={styles.section__sub__header}>Pressure</legend>
            <Radio name="pressure">in</Radio>
            <Radio name="pressure">mb</Radio>
            <Radio className={styles['section__sub__grid-col-end']} name="pressure">
              pa
            </Radio>
            <legend className={styles.section__sub__header}>Precipitation</legend>
            <Radio name="precipitation">in</Radio>
            <Radio className={styles['section__sub__grid-col-end']} name="precipitation">
              mm
            </Radio>
          </div>
        </fieldset>
      </div>
    </Overlay>
  );
}
