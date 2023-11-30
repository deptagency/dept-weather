import { ConditionSize } from 'components/Card/Condition/condition-size.model';
import { ConditionIcon } from 'components/Card/Condition/ConditionIcon';
import { ConditionLabel } from 'components/Card/Condition/ConditionLabel';
import { WindHelper } from 'helpers/wind-helper';
import { NwsHourlyPeriodForecast } from 'models/api/forecast.model';
import { UnitChoices, UnitType } from 'models/unit.enum';
import { getFormattedUnit, roundOrEmDash, roundTensOrEmDash } from 'utils';

import styles from './HourlyForecast.module.css';

const HOURLY_FORECAST_CONDITION_SIZE: ConditionSize = 'x-small';
export function HourlyForecast({
  units,
  forecast,
  isDaytime
}: {
  units: Pick<UnitChoices, UnitType.wind>;
  forecast: NwsHourlyPeriodForecast;
  isDaytime: boolean;
}) {
  return (
    <>
      <h5 className={styles['hourly-forecast__time-label']}>{forecast.startLabel}</h5>
      <ConditionIcon
        className={styles['hourly-forecast__condition__icon']}
        condition={forecast.condition}
        isNight={!isDaytime}
        size={HOURLY_FORECAST_CONDITION_SIZE}
        useEmptyDivIfNoIcon={true}
      />
      <ConditionLabel
        className={styles['hourly-forecast__condition__label']}
        condition={forecast.condition}
        size={HOURLY_FORECAST_CONDITION_SIZE}
      />
      <p className={styles['hourly-forecast__measurement']}>{`${roundOrEmDash(forecast.temperature)}°`}</p>
      <p className={styles['hourly-forecast__measurement']}>{`${roundTensOrEmDash(forecast.chanceOfPrecip)}%`}</p>
      <p className={styles['hourly-forecast__measurement']}>{`${roundOrEmDash(forecast.humidity)}%`}</p>
      <p className={styles['hourly-forecast__measurement']}>{`${roundOrEmDash(forecast.wind.speed)}${getFormattedUnit(
        units,
        UnitType.wind
      )} ${forecast.wind.directionDeg != null ? ` ${WindHelper.degToDir(forecast.wind.directionDeg)}` : ''}`}</p>
    </>
  );
}
