import { ComponentPropsWithoutRef, ComponentPropsWithRef, ForwardedRef, forwardRef, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Overlay } from 'components/Header/Overlay/Overlay';
import { SettingsInputs, SettingsOverlayProps } from 'components/Header/SettingsOverlay/SettingsOverlay.types';
import { CURRENT_LOCATION, LocalStorageKey } from 'constants/client';
import { DEFAULT_UNITS } from 'constants/shared';
import { SearchQueryHelper } from 'helpers/search-query-helper';
import { getLocalStorageItem, useLocalStorage } from 'hooks/use-local-storage';
import { SearchResultCity } from 'models/cities/cities.model';
import { Unit } from 'models/unit.enum';

import styles from './SettingsOverlay.module.css';
import homeStyles from 'styles/Home.module.css';

const NotificationsRow = ({
  city,
  className,
  ...props
}: { city: SearchResultCity } & Omit<ComponentPropsWithoutRef<'input'>, 'children' | 'name' | 'type'>) => (
  <label className={`${styles['notifications-row__label']} ${className ?? ''}`} suppressHydrationWarning>
    <input name={city.geonameid} type="checkbox" {...props} />
    <span>{SearchQueryHelper.getCityAndStateCode(city)}</span>
  </label>
);

const Radio = forwardRef<
  HTMLInputElement,
  Omit<ComponentPropsWithRef<'input'>, 'type'> & Required<Pick<ComponentPropsWithRef<'input'>, 'name' | 'children'>>
>(({ className, children, ...props }, ref: ForwardedRef<HTMLInputElement>) => (
  <label className={`${styles['radio-label']} ${className ?? ''}`}>
    <input ref={ref} type="radio" {...props} />
    <span>{children}</span>
  </label>
));
Radio.displayName = 'Radio';

export function SettingsOverlay({ showOverlay, recentCities: recentCitiesIn }: SettingsOverlayProps) {
  const [recentCities, setRecentCities] = useState<SettingsOverlayProps['recentCities']>([]);
  useEffect(
    () => setRecentCities(recentCitiesIn.filter(city => city.geonameid !== CURRENT_LOCATION.geonameid)),
    [recentCitiesIn]
  );

  const { register, control } = useForm<SettingsInputs>({
    defaultValues: {
      theme: getLocalStorageItem(LocalStorageKey.THEME) ?? 'system',
      units: { ...DEFAULT_UNITS, ...JSON.parse(getLocalStorageItem(LocalStorageKey.UNITS) ?? '{}') }
    }
  });

  useLocalStorage(
    LocalStorageKey.THEME,
    useWatch({
      control,
      name: 'theme'
    })
  );
  useLocalStorage(
    LocalStorageKey.UNITS,
    useWatch({
      control,
      name: 'units'
    })
  );

  // TODO - handle ESC key press
  return (
    <Overlay innerClassName={`${styles.inner} ${homeStyles.container__content}`} showOverlay={showOverlay}>
      <div className={styles['form-container']}>
        <form className={`animated ${styles['form']} ${showOverlay ? styles['form--end'] : ''}`}>
          <fieldset>
            <legend className={styles.section__header}>Theme</legend>
            <div className={styles['section__radio-group']}>
              <Radio {...register('theme')} value="auto">
                Auto
              </Radio>
              <Radio {...register('theme')} value="system">
                System
              </Radio>
              <Radio {...register('theme')} value="light">
                Light
              </Radio>
              <Radio {...register('theme')} value="dark">
                Dark
              </Radio>
            </div>
          </fieldset>
          <fieldset>
            <legend className={styles.section__header}>Units</legend>
            <div className={`${styles.section__sub} ${styles['section__sub--units']}`}>
              <legend className={styles.section__sub__header}>Temperature</legend>
              <Radio className={styles['section__sub__grid-col-3']} {...register('units.temp')} value={Unit.F}>
                °F
              </Radio>
              <Radio {...register('units.temp')} value={Unit.C}>
                °C
              </Radio>
              <legend className={styles.section__sub__header}>Wind Speed</legend>
              <Radio className={styles['section__sub__grid-col-3']} {...register('units.wind')} value={Unit.MILES}>
                mph
              </Radio>
              <Radio {...register('units.wind')} value={Unit.KM}>
                kmh
              </Radio>
              <legend className={styles.section__sub__header}>Pressure</legend>
              <Radio {...register('units.pressure')} value={Unit.INCHES}>
                in
              </Radio>
              <Radio {...register('units.pressure')} value={Unit.MILLIBAR}>
                mb
              </Radio>
              <legend className={styles.section__sub__header}>Precipitation</legend>
              <Radio
                className={styles['section__sub__grid-col-3']}
                {...register('units.precipitation')}
                value={Unit.INCHES}
              >
                in
              </Radio>
              <Radio {...register('units.precipitation')} value={Unit.MILLIMETERS}>
                mm
              </Radio>
            </div>
          </fieldset>
          <fieldset className={styles['section__notifications-container']}>
            <legend className={styles.section__header}>
              Notifications
              <span className={styles.section__header__description}>
                Receive severe weather alerts for selected cities
              </span>
            </legend>

            {/* TODO - WIP */}
            <div className={styles.section__notifications}>
              {recentCities.map(city => (
                <NotificationsRow city={city} key={city.geonameid} />
              ))}
            </div>
          </fieldset>
        </form>
      </div>
    </Overlay>
  );
}
