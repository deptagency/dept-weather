import { Unit } from '../models';
import { QuantitativeValue, UnitMappings } from '../models/nws';

export class NumberHelper {
  private static readonly CONVERSION_MAP = {
    [Unit.C]: {
      [Unit.F]: (value: number) => (value * 9) / 5 + 32
    },
    [Unit.F]: {
      [Unit.C]: (value: number) => ((value - 32) * 5) / 9
    },
    [Unit.KM]: {
      [Unit.MILES]: (value: number) => value * 0.62137
    },
    [Unit.MILES]: {
      [Unit.KM]: (value: number) => value * 1.609344
    }
  } as Record<Unit, Record<Unit, (value: number) => number>>;

  static round(value: number | null, n: number | undefined = 1) {
    if (value == null) {
      return null;
    }
    if (n === undefined) {
      return value;
    }

    const multiple = n === 0 ? 1 : Math.pow(10, n);
    return Math.round(value * multiple) / multiple;
  }

  static roundNws(quantitativeValue: QuantitativeValue, n: number | undefined = 1) {
    return this.round(quantitativeValue.value, n);
  }

  static convert(value: number | null, fromUnit: Unit, toUnit: Unit, roundN: number | undefined = 1) {
    if (value == null) {
      return null;
    }

    const convertedValue = fromUnit === toUnit ? value : this.CONVERSION_MAP[fromUnit][toUnit](value);
    return this.round(convertedValue, roundN);
  }

  static convertNws(quantitativeValue: QuantitativeValue, toUnit: Unit, roundN: number | undefined = 1) {
    return this.convert(quantitativeValue.value, UnitMappings[quantitativeValue.unitCode], toUnit, roundN);
  }
}
