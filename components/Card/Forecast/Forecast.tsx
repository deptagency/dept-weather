import AnimateHeight from 'react-animate-height';
import HourlyForecast from 'components/Card/HourlyForecast/HourlyForecast';
import SummaryForecast from 'components/Card/SummaryForecast/SummaryForecast';
import { HumidityIcon, PrecipitationIcon, ThermometerIcon, ThermometerLevel, WindIcon } from 'components/Icons';
import { UI_ANIMATION_DURATION } from 'constants/client';
import { useShouldContinueRendering } from 'hooks';
import { NwsHourlyPeriodForecast, NwsPeriodForecast } from 'models/api';

import styles from './Forecast.module.css';

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
      <SummaryForecast forecast={summaryForecast} isDaytime={isDaytime} />
      <AnimateHeight duration={UI_ANIMATION_DURATION} height={isExpanded ? 'auto' : 0} id={animatedContentsWrapperId}>
        {hourlyForecasts?.length && (isExpanded || shouldContinueRendering) ? (
          <>
            <div className={styles['forecast__hourly-forecasts']}>
              <div />
              <div />
              <div />
              <ThermometerIcon ariaLabel="Temperature" level={ThermometerLevel.MEDIUM} />
              <PrecipitationIcon ariaLabel="Chance of Precipitation" innerDropHeightPercent={0} />
              <HumidityIcon ariaLabel="Humidity" />
              <WindIcon ariaLabel="Wind" directionDeg={undefined} />
              {hourlyForecasts.map((hourlyForecast, i) => (
                <HourlyForecast forecast={hourlyForecast} isDaytime={isDaytime} key={i} />
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
