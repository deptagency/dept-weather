import { useEffect, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { HumidityIcon, PrecipitationIcon, WindIcon } from 'components/Icons';
import { NwsHourlyPeriodForecast, NwsPeriodForecast } from 'models/api';
import HourlyForecast from '../HourlyForecast/HourlyForecast';
import SummaryForecast from '../SummaryForecast/SummaryForecast';
import styles from './Forecast.module.css';

const ANIMATED_CONTENTS_WRAPPER_ID = 'HourlyForecastsWrapper';

export default function Forecast({
  summaryForecast,
  hourlyForecasts,
  isDaytime,
  _key
}: {
  summaryForecast: NwsPeriodForecast | null | undefined;
  hourlyForecasts: NwsHourlyPeriodForecast[] | null | undefined;
  isDaytime: boolean;
  _key: string;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const [animatedContentsWrapperId, setAnimatedContentsWrapperId] = useState<string>(ANIMATED_CONTENTS_WRAPPER_ID);
  useEffect(() => setAnimatedContentsWrapperId(`${ANIMATED_CONTENTS_WRAPPER_ID}-${_key}`), [_key]);

  return (
    <>
      <SummaryForecast
        forecast={summaryForecast}
        isDaytime={isDaytime}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      ></SummaryForecast>
      <AnimateHeight id={animatedContentsWrapperId} duration={300} height={isExpanded ? 'auto' : 0}>
        {hourlyForecasts?.length ? (
          <>
            <div className={styles['forecast__hourly-forecasts']}>
              <div></div>
              <div></div>
              {/* TODO - add Temperature icon */}
              <div></div>
              <PrecipitationIcon innerDropHeightPercent={0}></PrecipitationIcon>
              <HumidityIcon></HumidityIcon>
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
