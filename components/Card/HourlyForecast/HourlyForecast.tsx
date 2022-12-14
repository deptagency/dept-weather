import { NwsHourlyPeriodForecast } from 'models/api';
import { roundOrEmDash } from 'utils';
import Condition from '../Condition/Condition';

export default function HourlyForecast({
  forecast,
  isDaytime
}: {
  forecast: NwsHourlyPeriodForecast;
  isDaytime: boolean;
}) {
  return (
    <>
      <h5>{forecast.startLabel}</h5>
      <Condition condition={forecast.condition} size="x-small" isNight={!isDaytime}></Condition>
      <p>{`${roundOrEmDash(forecast.temperature)}°`}</p>
      <p>{`${roundOrEmDash(forecast.chanceOfPrecip)}%`}</p>
      <p>{`${roundOrEmDash(forecast.humidity)}%`}</p>
      <p>{`${roundOrEmDash(forecast.wind.speed)}mph`}</p>
    </>
  );
}
