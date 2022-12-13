import { WindIcon } from 'components/Icons';
import { roundOrEmDash } from 'utils';
import { WindDirection } from 'models';
import { Wind as WindModel } from 'models/api';
import Measurement from '../Measurement';

const getWindDirection = (deg: number) => {
  if (deg > 337.5 || deg <= 22.5) return WindDirection.N;
  else if (deg <= 67.5) return WindDirection.NE;
  else if (deg <= 112.5) return WindDirection.E;
  else if (deg <= 157.5) return WindDirection.SE;
  else if (deg <= 202.5) return WindDirection.S;
  else if (deg <= 247.5) return WindDirection.SW;
  else if (deg <= 292.5) return WindDirection.W;
  else if (deg <= 337.5) return WindDirection.NW;

  return '';
};

export default function Wind({ wind, includeGustSpeed }: { wind: WindModel | undefined; includeGustSpeed: boolean }) {
  return (
    <Measurement
      value={
        <>
          {roundOrEmDash(wind?.speed)} <span>mph</span>
          {wind?.directionDeg != null ? ` ${getWindDirection(wind.directionDeg)}` : ''}
        </>
      }
      secondaryValue={includeGustSpeed ? `${roundOrEmDash(wind?.gustSpeed)} mph gusts` : undefined}
      label="Wind"
      icon={<WindIcon directionDeg={wind?.directionDeg}></WindIcon>}
    ></Measurement>
  );
}
