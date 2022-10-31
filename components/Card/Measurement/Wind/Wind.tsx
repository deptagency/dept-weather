import { roundOrEmDash } from '../../../../utils';
import { Wind as WindModel } from '../../../../models/api';
import { WindDirection } from '../../../../models';
import Measurement from '../Measurement';
import { WindIcon } from './WindIcon';

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

export default function Wind({ wind }: { wind?: WindModel }) {
  return (
    <Measurement
      value={
        <>
          {roundOrEmDash(wind?.speed)} <span>mph</span>
          {wind?.direction != null ? ` ${getWindDirection(wind.direction)}` : ''}
        </>
      }
      secondaryValue={`${roundOrEmDash(wind?.gustSpeed)} mph gusts`}
      label="Wind"
      icon={WindIcon(wind?.direction)}
    ></Measurement>
  );
}
