import { roundOrEmDash } from '../../../../utils';
import { WindForecast as WindForecastModel } from '../../../../models/api';
import { DetailedWindDirection, WindDirection } from '../../../../models';
import Measurement from '../Measurement';
import { WindIcon } from './WindIcon';

const getWindDirectionDeg = (dir?: WindDirection | DetailedWindDirection | null) => {
  if (dir === WindDirection.N) return 0;
  else if (dir === DetailedWindDirection.NNE) return 22.5;
  else if (dir === WindDirection.NE) return 45;
  else if (dir === DetailedWindDirection.ENE) return 67.5;
  else if (dir === WindDirection.E) return 90;
  else if (dir === DetailedWindDirection.ESE) return 112.5;
  else if (dir === WindDirection.SE) return 135;
  else if (dir === DetailedWindDirection.SSE) return 157.5;
  else if (dir === WindDirection.S) return 180;
  else if (dir === DetailedWindDirection.SSW) return 202.5;
  else if (dir === WindDirection.SW) return 225;
  else if (dir === DetailedWindDirection.WSW) return 247.5;
  else if (dir === WindDirection.W) return 270;
  else if (dir === DetailedWindDirection.WNW) return 292.5;
  else if (dir === WindDirection.NW) return 315;
  else if (dir === DetailedWindDirection.NNW) return 337.5;

  return null;
};

const getSimplifiedWindDirection = (dir: WindDirection | DetailedWindDirection) => {
  if (dir === DetailedWindDirection.NNE || dir === DetailedWindDirection.ENE) return WindDirection.NE;
  else if (dir === DetailedWindDirection.ESE || dir === DetailedWindDirection.SSE) return WindDirection.SE;
  else if (dir === DetailedWindDirection.SSW || dir === DetailedWindDirection.WSW) return WindDirection.SW;
  else if (dir === DetailedWindDirection.WNW || dir === DetailedWindDirection.NNW) return WindDirection.NW;

  return dir;
};

const getSpeed = (
  speed: number | null | undefined,
  minSpeed: number | null | undefined,
  maxSpeed: number | null | undefined
) => {
  return minSpeed != null && maxSpeed != null
    ? `${Math.round(minSpeed)}-${Math.round(maxSpeed)}`
    : roundOrEmDash(speed);
};

export default function WindForecast({ wind }: { wind?: WindForecastModel }) {
  return (
    <Measurement
      value={
        <>
          {getSpeed(wind?.speed, wind?.minSpeed, wind?.maxSpeed)} <span>mph</span>
          {wind?.direction != null ? ` ${getSimplifiedWindDirection(wind.direction)}` : ''}
        </>
      }
      label="Wind"
      icon={WindIcon(getWindDirectionDeg(wind?.direction))}
    ></Measurement>
  );
}
