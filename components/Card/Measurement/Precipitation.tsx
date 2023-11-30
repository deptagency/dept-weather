import { Measurement } from 'components/Card/Measurement/Measurement';
import { PrecipitationIcon } from 'components/Icons/PrecipitationIcon';
import { UnitChoices, UnitType } from 'models/unit.enum';
import { getFormattedUnit, toFixedOrEmDash } from 'utils';

export function Precipitation({
  precipitation,
  label,
  units
}: {
  precipitation?: number | null | undefined;
  label: string;
  units: Pick<UnitChoices, UnitType.precipitation>;
}) {
  return (
    <Measurement
      icon={<PrecipitationIcon innerDropHeightPercent={0} />}
      label={label}
      value={
        <>
          {toFixedOrEmDash(precipitation)}{' '}
          <span suppressHydrationWarning>{getFormattedUnit(units, UnitType.precipitation)}</span>
        </>
      }
    />
  );
}
