import { Measurement } from 'components/Card/Measurement/Measurement';
import { PressureIcon, PressureLevel, PressureTrend } from 'components/Icons/PressureIcon';
import { WlPressure } from 'models/api/observations.model';
import { toFixedOrEmDash } from 'utils';

type PressureArg = (Pick<WlPressure, 'atSeaLevel'> & Partial<Pick<WlPressure, 'trend'>>) | null | undefined;

const LOW_PRESSURE = 29.7;
const HIGH_PRESSURE = 30.1;
const getPressureLevel = (pressure?: PressureArg): PressureLevel => {
  if (pressure?.atSeaLevel == null) return PressureLevel.MEDIUM;
  else if (pressure.atSeaLevel < LOW_PRESSURE) return PressureLevel.LOW;
  else if (pressure.atSeaLevel > HIGH_PRESSURE) return PressureLevel.HIGH;
  else return PressureLevel.MEDIUM;
};

const STABLE_PRESSURE_TREND = 0.059; // ≈ 2 mb
const getPressureTrend = (pressure?: PressureArg): PressureTrend => {
  if (pressure?.trend == null) return PressureTrend.UNKNOWN;
  else if (pressure.trend < STABLE_PRESSURE_TREND * -1) return PressureTrend.DECREASING;
  else if (pressure.trend > STABLE_PRESSURE_TREND) return PressureTrend.INCREASING;
  else return PressureTrend.STABLE;
};

export function Pressure({ pressure }: { pressure?: PressureArg }) {
  const level = getPressureLevel(pressure);
  const trend = getPressureTrend(pressure);

  let trendArrow = '';
  if (trend === PressureTrend.DECREASING) trendArrow = ' ↓';
  else if (trend === PressureTrend.STABLE) trendArrow = ' →';
  else if (trend === PressureTrend.INCREASING) trendArrow = ' ↑';

  return (
    <Measurement
      icon={<PressureIcon level={level} trend={trend} />}
      label="Pressure"
      value={
        <>
          {toFixedOrEmDash(pressure?.atSeaLevel)} <span>in</span>
          {trendArrow}
        </>
      }
    />
  );
}
