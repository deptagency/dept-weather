import AnimateHeight from 'react-animate-height';
import { PrecipitationIcon, ThermometerIcon, ThermometerLevel, WindIcon } from 'components/Icons';
import { NwsHourlyPeriodForecast, NwsPeriodForecast } from 'models/api';
import HourlyForecast from '../HourlyForecast/HourlyForecast';
import SummaryForecast from '../SummaryForecast/SummaryForecast';
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
