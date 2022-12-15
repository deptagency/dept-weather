import { useEffect, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { PrecipitationIcon, ThermometerIcon, ThermometerLevel, WindIcon } from 'components/Icons';
import { NwsHourlyPeriodForecast, NwsPeriodForecast } from 'models/api';
import HourlyForecast from '../HourlyForecast/HourlyForecast';
import SummaryForecast from '../SummaryForecast/SummaryForecast';
import styles from './Forecast.module.css';

const ANIMATED_CONTENTS_WRAPPER_ID = 'HourlyForecastsWrapper';

export default function Forecast({
  summaryForecast,
  hourlyForecasts,
  isDaytime,
  isExpanded,
  _key
}: {
  summaryForecast: NwsPeriodForecast | null | undefined;
  hourlyForecasts: NwsHourlyPeriodForecast[] | null | undefined;
  isDaytime: boolean;
  isExpanded: boolean;
  _key: string;
}) {
  const [animatedContentsWrapperId, setAnimatedContentsWrapperId] = useState<string>(ANIMATED_CONTENTS_WRAPPER_ID);
  useEffect(() => setAnimatedContentsWrapperId(`${ANIMATED_CONTENTS_WRAPPER_ID}-${_key}`), [_key]);

  return (
    <>
      <SummaryForecast forecast={summaryForecast} isDaytime={isDaytime}></SummaryForecast>
      <AnimateHeight id={animatedContentsWrapperId} duration={300} height={isExpanded ? 'auto' : 0}>
        {hourlyForecasts?.length ? (
          <>
            <div className={styles['forecast__hourly-forecasts']}>
              <div></div>
              <div></div>
              <div></div>
              <ThermometerIcon level={ThermometerLevel.MEDIUM}></ThermometerIcon>
              <PrecipitationIcon innerDropHeightPercent={0}></PrecipitationIcon>
              <WindIcon directionDeg={undefined}></WindIcon>
              {hourlyForecasts.map((hourlyForecast, i) => (
                <HourlyForecast key={i} forecast={hourlyForecast} isDaytime={isDaytime}></HourlyForecast>
              ))}
            </div>
          </>
        ) : (
          <></>
        )}
      </AnimateHeight>
    </>
  );
}
