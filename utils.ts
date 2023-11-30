import { DEFAULT_UNITS } from 'constants/shared';
import { Unit, UnitChoices, UnitType } from 'models/unit.enum';

export const roundOrEmDash = (value: number | null | undefined) => (value != null ? Math.round(value) : '–');
export const roundTensOrEmDash = (value: number | null | undefined) =>
  value != null ? Math.round(value / 10) * 10 : '–';
export const floorOrEmDash = (value: number | null | undefined) => (value != null ? Math.floor(value) : '–');

export const toFixedOrEmDash = (value: number | null | undefined, fractionDigits = 2) =>
  value != null ? value.toFixed(fractionDigits) : '–';

export const getFormattedUnit = (units: Partial<UnitChoices>, unitType: UnitType) => {
  const unit = (unitType in units ? units : DEFAULT_UNITS)[unitType];

  if (unitType === UnitType.temp) {
    if (unit === Unit.F) return '°F';
    else if (unit === Unit.C) return '°C';
  } else if (unitType === UnitType.wind) {
    if (unit === Unit.MILES) return 'mph';
    else if (unit === Unit.KM) return 'km/h';
  } else if (unitType === UnitType.pressure) {
    if (unit === Unit.INCHES) return 'in';
    else if (unit === Unit.MILLIBAR) return 'mb';
  } else if (unitType === UnitType.precipitation) {
    if (unit === Unit.INCHES) return 'in';
    else if (unit === Unit.MILLIMETERS) return 'mm';
  }

  return '';
};
