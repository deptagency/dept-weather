import { useEffect, useState } from 'react';
import { StandardCardHeader } from 'components/Card/CardHeader/StandardCardHeader';
import { Forecast } from 'components/Card/Forecast/Forecast';
import { ForecastTemps } from 'components/Card/ForecastTemps/ForecastTemps';
import { NwsPeriod } from 'models/api/forecast.model';
import { Color } from 'models/color.enum';

import styles from './Card.module.css';

const ANIMATED_HOURLY_FORECASTS_WRAPPER_ID = 'HourlyForecastsWrapper';

export function ForecastCard({
  isLoading,
  latestReadTime,
  period,
  _key
}: {
  isLoading?: boolean;
  latestReadTime?: number;
  period: NwsPeriod;
  _key: string;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [animatedContentsWrapperIds, setAnimatedContentsWrapperIds] = useState<string[]>([
    `${ANIMATED_HOURLY_FORECASTS_WRAPPER_ID}-day`,
    `${ANIMATED_HOURLY_FORECASTS_WRAPPER_ID}-night`
  ]);
  useEffect(() => {
    const baseId = `${ANIMATED_HOURLY_FORECASTS_WRAPPER_ID}-${_key}`;
    setAnimatedContentsWrapperIds([`${baseId}-day`, `${baseId}-night`]);
  }, [_key]);

  return (
    <article className={styles.card}>
      <StandardCardHeader
        ariaControls={animatedContentsWrapperIds.join(',')}
        backgroundColor={Color.FOREGROUND_LIGHT}
        disabledExpand={!period.dayHourlyForecasts?.length && !period.nightHourlyForecasts?.length}
        foregroundColor={Color.BACKGROUND}
        isExpanded={isExpanded}
        isLoading={isLoading}
        label={period.dayName}
        lastUpdatedTime={latestReadTime}
        secondaryLabel={period.shortDateName}
        setIsExpanded={setIsExpanded}
      />
      <div className={styles['card-contents']}>
        <div className={`${styles['card-contents__overview']} ${styles['card-contents__overview--forecast']}`}>
          <ForecastTemps
            highTemperature={period.dayForecast?.temperature}
            lowTemperature={period.nightForecast?.temperature}
          />
        </div>
        <div className={styles['card-contents__forecasts']}>
          <Forecast
            animatedContentsWrapperId={animatedContentsWrapperIds[0]}
            hourlyForecasts={period.dayHourlyForecasts}
            isDaytime={true}
            isExpanded={isExpanded}
            summaryForecast={period.dayForecast}
          />
          <Forecast
            animatedContentsWrapperId={animatedContentsWrapperIds[1]}
            hourlyForecasts={period.nightHourlyForecasts}
            isDaytime={false}
            isExpanded={isExpanded}
            summaryForecast={period.nightForecast}
          />
        </div>
      </div>
    </article>
  );
}
