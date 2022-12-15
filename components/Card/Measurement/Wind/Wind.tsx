import { WindIcon } from 'components/Icons';
import { roundOrEmDash } from 'utils';
import { Wind as WindModel } from 'models/api';
import Measurement from '../Measurement';
import { WindHelper } from 'helpers';

export default function Wind({ wind, includeGustSpeed }: { wind: WindModel | undefined; includeGustSpeed: boolean }) {
  return (
    <Measurement
      value={
        <>
          {roundOrEmDash(wind?.speed)} <span>mph</span>
          {wind?.directionDeg != null ? ` ${WindHelper.degToDir(wind.directionDeg)}` : ''}
        </>
      }
      secondaryValue={includeGustSpeed ? `${roundOrEmDash(wind?.gustSpeed)} mph gusts` : undefined}
      label="Wind"
      icon={<WindIcon directionDeg={wind?.directionDeg}></WindIcon>}
    ></Measurement>
  );
}
