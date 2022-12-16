import { useEffect, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { PrecipitationIcon, ThermometerIcon, ThermometerLevel, WindIcon } from 'components/Icons';
import { UI_ANIMATION_DURATION } from 'constants/client';
import { NwsHourlyPeriodForecast, NwsPeriodForecast } from 'models/api';
import HourlyForecast from '../HourlyForecast/HourlyForecast';
import SummaryForecast from '../SummaryForecast/SummaryForecast';
import styles from './Forecast.module.css';
import { useShouldContinueRendering } from 'hooks';

export default function Forecast({
  summaryForecast,
  hourlyForecasts,
  isDaytime,
  isExpanded,
  animatedContentsWrapperId
}: {
  summaryForecast: NwsPeriodForecast | null | undefined;
  hourlyForecasts: NwsHourlyPeriodForecast[] | null | undefined;
  isDaytime: boolean;
  isExpanded: boolean;
  animatedContentsWrapperId: string;
}) {
  const shouldContinueRendering = useShouldContinueRendering(isExpanded);
  return (
    <>
      <SummaryForecast forecast={summaryForecast} isDaytime={isDaytime}></SummaryForecast>
      <AnimateHeight id={animatedContentsWrapperId} duration={UI_ANIMATION_DURATION} height={isExpanded ? 'auto' : 0}>
        {hourlyForecasts?.length && (isExpanded || shouldContinueRendering) ? (
          <>
            <div className={styles['forecast__hourly-forecasts']}>
              <div></div>
              <div></div>
              <div></div>
              <ThermometerIcon level={ThermometerLevel.MEDIUM} ariaLabel="Temperature"></ThermometerIcon>
              <PrecipitationIcon innerDropHeightPercent={0} ariaLabel="Chance of Precipitation"></PrecipitationIcon>
              <WindIcon directionDeg={undefined} ariaLabel="Wind"></WindIcon>
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
