import Measurement from 'components/Card/Measurement/Measurement';
import { WindIcon } from 'components/Icons';
import { WindHelper } from 'helpers';
import { Wind as WindModel } from 'models/api';
import { roundOrEmDash } from 'utils';

export default function Wind({ wind, includeGustSpeed }: { wind: WindModel | undefined; includeGustSpeed: boolean }) {
  return (
    <Measurement
      icon={<WindIcon directionDeg={wind?.directionDeg} />}
      label="Wind"
      secondaryValue={includeGustSpeed ? `${roundOrEmDash(wind?.gustSpeed)} mph gusts` : undefined}
      value={
        <>
          {roundOrEmDash(wind?.speed)} <span>mph</span>
          {wind?.directionDeg != null ? ` ${WindHelper.degToDir(wind.directionDeg)}` : ''}
        </>
      }
    />
  );
}
