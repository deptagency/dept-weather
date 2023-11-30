import AnimateHeight from 'react-animate-height';
import { HourlyForecast } from 'components/Card/HourlyForecast/HourlyForecast';
import { SummaryForecast } from 'components/Card/SummaryForecast/SummaryForecast';
import { HumidityIcon } from 'components/Icons/HumidityIcon';
import { PrecipitationIcon } from 'components/Icons/PrecipitationIcon';
import { ThermometerIcon, ThermometerLevel } from 'components/Icons/ThermometerIcon';
import { WindIcon } from 'components/Icons/WindIcon';
import { UI_ANIMATION_DURATION } from 'constants/client';
import { useShouldContinueRendering } from 'hooks/use-should-continue-rendering';
import { NwsHourlyPeriodForecast, NwsPeriodForecast } from 'models/api/forecast.model';
import { UnitChoices } from 'models/unit.enum';

import styles from './Forecast.module.css';

export function Forecast({
  windUnit,
  summaryForecast,
  hourlyForecasts,
  isDaytime,
  isExpanded,
  animatedContentsWrapperId
}: {
  windUnit: UnitChoices['wind'];
  summaryForecast: NwsPeriodForecast | null | undefined;
  hourlyForecasts: NwsHourlyPeriodForecast[] | null | undefined;
  isDaytime: boolean;
  isExpanded: boolean;
  animatedContentsWrapperId: string;
}) {
  const shouldContinueRendering = useShouldContinueRendering(isExpanded);
  return (
    <>
      <SummaryForecast forecast={summaryForecast} isDaytime={isDaytime} windUnit={windUnit} />
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
                <HourlyForecast forecast={hourlyForecast} isDaytime={isDaytime} key={i} windUnit={windUnit} />
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
