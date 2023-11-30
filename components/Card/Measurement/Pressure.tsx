import { Measurement } from 'components/Card/Measurement/Measurement';
import { PressureIcon } from 'components/Icons/PressureIcon';
import { BasePressure, WlPressure } from 'models/api/observations.model';
import { Unit, UnitChoices, UnitType } from 'models/unit.enum';
import { getFormattedUnit, toFixedOrEmDash } from 'utils';

export function Pressure({
  pressure,
  units
}: {
  pressure: (BasePressure & Partial<WlPressure>) | null | undefined;
  units: Pick<UnitChoices, UnitType.pressure>;
}) {
  let trendArrow = '';
  if (pressure?.trendDescription === 'decreasing') trendArrow = ' ↓';
  else if (pressure?.trendDescription === 'stable') trendArrow = ' →';
  else if (pressure?.trendDescription === 'increasing') trendArrow = ' ↑';

  return (
    <Measurement
      icon={<PressureIcon level={pressure?.atSeaLevelDescription} trend={pressure?.trendDescription} />}
      label="Pressure"
      value={
        <>
          {toFixedOrEmDash(pressure?.atSeaLevel, units[UnitType.pressure] === Unit.INCHES ? 2 : 1)}{' '}
          <span suppressHydrationWarning>{getFormattedUnit(units, UnitType.pressure)}</span>
          {trendArrow}
        </>
      }
    />
  );
}
