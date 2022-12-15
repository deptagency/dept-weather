import { WindHelper } from 'helpers';
import { NwsHourlyPeriodForecast } from 'models/api';
import { roundOrEmDash, roundTensOrEmDash } from 'utils';
import { ConditionSize } from '../Condition/condition-size.model';
import ConditionIcon from '../Condition/ConditionIcon';
import ConditionLabel from '../Condition/ConditionLabel';
import styles from './HourlyForecast.module.css';

const HOURLY_FORECAST_CONDITION_SIZE: ConditionSize = 'x-small';
export default function HourlyForecast({
  forecast,
  isDaytime
}: {
  forecast: NwsHourlyPeriodForecast;
  isDaytime: boolean;
}) {
  return (
    <>
      <h5 className={styles['hourly-forecast__time-label']}>{forecast.startLabel}</h5>
      <ConditionIcon
        condition={forecast.condition}
        size={HOURLY_FORECAST_CONDITION_SIZE}
        useEmptyDivIfNoIcon={true}
        isNight={!isDaytime}
      ></ConditionIcon>
      <ConditionLabel condition={forecast.condition} size={HOURLY_FORECAST_CONDITION_SIZE}></ConditionLabel>
      <p className={styles['hourly-forecast__measurement']}>{`${roundOrEmDash(forecast.temperature)}°`}</p>
      <p className={styles['hourly-forecast__measurement']}>{`${roundTensOrEmDash(forecast.chanceOfPrecip)}%`}</p>
      <p className={styles['hourly-forecast__measurement']}>{`${roundOrEmDash(forecast.wind.speed)}mph ${
        forecast.wind.directionDeg != null ? ` ${WindHelper.degToDir(forecast.wind.directionDeg)}` : ''
      }`}</p>
    </>
  );
}
