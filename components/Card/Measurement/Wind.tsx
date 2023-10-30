import { Measurement } from 'components/Card/Measurement/Measurement';
import { WindIcon } from 'components/Icons/WindIcon';
import { WindHelper } from 'helpers/wind-helper';
import { Wind as WindModel } from 'models/api/observations.model';
import { roundOrEmDash } from 'utils';

export function Wind({ wind, includeGustSpeed }: { wind: WindModel | undefined; includeGustSpeed: boolean }) {
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
