import { Measurement } from 'components/Card/Measurement/Measurement';
import { WindIcon } from 'components/Icons/WindIcon';
import { WindHelper } from 'helpers/wind-helper';
import { Wind as WindModel } from 'models/api/observations.model';
import { UnitChoices, UnitType } from 'models/unit.enum';
import { getFormattedUnit, roundOrEmDash } from 'utils';

export function Wind({
  wind,
  includeGustSpeed,
  unit
}: {
  wind: WindModel | undefined;
  includeGustSpeed: boolean;
  unit: UnitChoices[UnitType.wind];
}) {
  const formattedUnit = getFormattedUnit(UnitType.wind, unit);

  return (
    <Measurement
      icon={<WindIcon directionDeg={wind?.directionDeg} />}
      label="Wind"
      secondaryValue={includeGustSpeed ? `${roundOrEmDash(wind?.gustSpeed)} ${formattedUnit} gusts` : undefined}
      value={
        <>
          {roundOrEmDash(wind?.speed)} <span suppressHydrationWarning>{formattedUnit}</span>
          {wind?.directionDeg != null ? ` ${WindHelper.degToDir(wind.directionDeg)}` : ''}
        </>
      }
    />
  );
}
