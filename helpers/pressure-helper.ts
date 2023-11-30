import { NumberHelper } from 'helpers/number-helper';
import { PressureLevelDescription, PressureTrendDescription } from 'models/api/observations.model';
import { Unit, UnitType } from 'models/unit.enum';

export class PressureHelper {
  private static readonly LOW_PRESSURE_IN = 29.7; // ≈ 1005.8
  private static readonly HIGH_PRESSURE_IN = 30.1; // ≈ 1019.3
  static getAtSeaLevelDescription(value: number | null, from: Unit): PressureLevelDescription | null {
    const atSeaLevel = NumberHelper.convert(
      value,
      NumberHelper.getUnitMapping(UnitType.pressure, from, { [UnitType.pressure]: Unit.INCHES }),
      null
    );

    if (atSeaLevel == null) return null;
    else if (atSeaLevel < this.LOW_PRESSURE_IN) return 'low';
    else if (atSeaLevel > this.HIGH_PRESSURE_IN) return 'high';
    else return 'medium';
  }

  private static readonly STABLE_PRESSURE_TREND_IN = 0.059; // ≈ 2 mb
  static getTrendDescription(value: number | null, from: Unit): PressureTrendDescription | null {
    const trend = NumberHelper.convert(
      value,
      NumberHelper.getUnitMapping(UnitType.pressure, from, { [UnitType.pressure]: Unit.INCHES }),
      null
    );

    if (trend == null) return null;
    else if (trend < this.STABLE_PRESSURE_TREND_IN * -1) return 'decreasing';
    else if (trend > this.STABLE_PRESSURE_TREND_IN) return 'increasing';
    else return 'stable';
  }
}
