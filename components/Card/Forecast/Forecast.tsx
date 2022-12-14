import { useEffect, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { NwsHourlyPeriodForecast, NwsPeriodForecast } from 'models/api';
import HourlyForecast from '../HourlyForecast/HourlyForecast';
import SummaryForecast from '../SummaryForecast/SummaryForecast';

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
        {(hourlyForecasts ?? []).map((hourlyForecast, i) => (
          <HourlyForecast key={i} forecast={hourlyForecast} isDaytime={isDaytime}></HourlyForecast>
        ))}
      </AnimateHeight>
    </>
  );
}
