import { ComponentPropsWithoutRef, ComponentPropsWithRef, ForwardedRef, forwardRef, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Overlay } from 'components/Header/Overlay/Overlay';
import { SettingsInputs, SettingsOverlayProps } from 'components/Header/SettingsOverlay/SettingsOverlay.types';
import { CURRENT_LOCATION, DEFAULT_APP_THEME, LocalStorageKey } from 'constants/client';
import { DEFAULT_UNITS } from 'constants/shared';
import { AppThemeHelper } from 'helpers/app-theme';
import { SearchQueryHelper } from 'helpers/search-query-helper';
import { getLocalStorageItem, setLocalStorageItem } from 'hooks/use-local-storage';
import { SearchResultCity } from 'models/cities/cities.model';
import { Unit, UnitChoices, UnitType } from 'models/unit.enum';
import { getFormattedUnit } from 'utils';

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

export function SettingsOverlay({
  showOverlay,
  recentCities: recentCitiesIn,
  onUnitChoicesChange
}: SettingsOverlayProps) {
  const [recentCities, setRecentCities] = useState<SettingsOverlayProps['recentCities']>([]);
  useEffect(
    () => setRecentCities(recentCitiesIn.filter(city => city.geonameid !== CURRENT_LOCATION.geonameid)),
    [recentCitiesIn]
  );

  const { register, control } = useForm<SettingsInputs>({
    defaultValues: {
      [LocalStorageKey.APP_THEME]: getLocalStorageItem(LocalStorageKey.APP_THEME) ?? DEFAULT_APP_THEME,
      [LocalStorageKey.UNITS]: {
        ...DEFAULT_UNITS,
        ...(JSON.parse(getLocalStorageItem(LocalStorageKey.UNITS) ?? '{}') as Partial<UnitChoices>)
      }
    }
  });

  const appTheme = useWatch({
    control,
    name: LocalStorageKey.APP_THEME
  });
  useEffect(() => {
    setLocalStorageItem(LocalStorageKey.APP_THEME, appTheme);
    AppThemeHelper.updateColorScheme(AppThemeHelper.prevIsNightVal);
  }, [appTheme]);

  const unitChoices = useWatch({
    control,
    name: LocalStorageKey.UNITS
  });
  useEffect(() => {
    setLocalStorageItem(LocalStorageKey.UNITS, unitChoices);
    onUnitChoicesChange();
  }, [unitChoices, onUnitChoicesChange]);

  // TODO - handle ESC key press
  return (
    <Overlay innerClassName={`${styles.inner} ${homeStyles.container__content}`} showOverlay={showOverlay}>
      <div className={styles['form-container']}>
        <form className={`animated ${styles['form']} ${showOverlay ? styles['form--end'] : ''}`}>
          <fieldset>
            <legend className={styles.section__header}>Theme</legend>
            <div className={styles['section__radio-group']}>
              <Radio {...register('appTheme')} value="system">
                System
              </Radio>
              <Radio {...register('appTheme')} value="auto">
                Auto
              </Radio>
              <Radio {...register('appTheme')} value="light">
                Light
              </Radio>
              <Radio {...register('appTheme')} value="dark">
                Dark
              </Radio>
            </div>
          </fieldset>
          <fieldset>
            <legend className={styles.section__header}>Units</legend>
            <div className={`${styles.section__sub} ${styles['section__sub--units']}`}>
              <legend className={styles.section__sub__header}>Temperature</legend>
              <Radio className={styles['section__sub__grid-col-3']} {...register('units.temp')} value={Unit.F}>
                {getFormattedUnit(UnitType.temp, Unit.F)}
              </Radio>
              <Radio {...register('units.temp')} value={Unit.C}>
                {getFormattedUnit(UnitType.temp, Unit.C)}
              </Radio>
              <legend className={styles.section__sub__header}>Wind Speed</legend>
              <Radio className={styles['section__sub__grid-col-3']} {...register('units.wind')} value={Unit.MILES}>
                {getFormattedUnit(UnitType.wind, Unit.MILES)}
              </Radio>
              <Radio {...register('units.wind')} value={Unit.KM}>
                {getFormattedUnit(UnitType.wind, Unit.KM)}
              </Radio>
              <legend className={styles.section__sub__header}>Pressure</legend>
              <Radio {...register('units.pressure')} value={Unit.INCHES}>
                {getFormattedUnit(UnitType.pressure, Unit.INCHES)}
              </Radio>
              <Radio {...register('units.pressure')} value={Unit.MILLIBAR}>
                {getFormattedUnit(UnitType.pressure, Unit.MILLIBAR)}
              </Radio>
              <legend className={styles.section__sub__header}>Precipitation</legend>
              <Radio
                className={styles['section__sub__grid-col-3']}
                {...register('units.precipitation')}
                value={Unit.INCHES}
              >
                {getFormattedUnit(UnitType.precipitation, Unit.INCHES)}
              </Radio>
              <Radio {...register('units.precipitation')} value={Unit.MILLIMETERS}>
                {getFormattedUnit(UnitType.precipitation, Unit.MILLIMETERS)}
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
