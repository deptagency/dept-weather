import { DEFAULT_UNITS } from 'constants/shared';
import { CONVERSION_FACTORS, Unit, UnitMapping, Units, UnitType } from 'models';
import { ReqQuery } from 'models/api';
import { NwsUnits, QuantitativeValue } from 'models/nws';

export class NumberHelper {
  static round(
    value: number | null,
    n: number | null = 1,
    method: Extract<keyof Math, 'floor' | 'ceil' | 'round'> = 'round'
  ) {
    if (value == null) return null;
    if (n == null) return value;

    const multiple = Math.pow(10, n);
    return Math[method](value * multiple) / multiple;
  }

  static roundNws(quantitativeValue: QuantitativeValue | undefined, n: number | null = 1) {
    return this.round(quantitativeValue?.value ?? null, n);
  }

  static convert(value: number | null, unitMapping: UnitMapping | null, roundN: number | null = 1) {
    if (value == null || unitMapping == null) {
      return null;
    }

    let convertedValue: number;
    if (unitMapping.from === unitMapping.to) {
      convertedValue = value;
    } else if (unitMapping.from === Unit.C && unitMapping.to === Unit.F) {
      convertedValue = (value * 9) / 5 + 32;
    } else if (unitMapping.from === Unit.F && unitMapping.to === Unit.C) {
      convertedValue = ((value - 32) * 5) / 9;
    } else {
      const fromConversionFactors = CONVERSION_FACTORS[unitMapping.from];
      if (fromConversionFactors != null && fromConversionFactors[unitMapping.to] != null) {
        convertedValue = value * fromConversionFactors[unitMapping.to]!;
      } else {
        convertedValue = value / CONVERSION_FACTORS[unitMapping.to]![unitMapping.from]!;
      }
    }

    return this.round(convertedValue, roundN);
  }

  static convertNwsRawValueAndUnitCode(
    value: number | null,
    unitCode: string,
    unitType: UnitType,
    reqQuery: ReqQuery,
    roundN: number | null = 1
  ) {
    return this.convert(value, this.getUnitMapping(unitType, NwsUnits[unitCode], reqQuery), roundN);
  }

  static convertNws(
    quantitativeValue: QuantitativeValue | undefined,
    unitType: UnitType,
    reqQuery: ReqQuery,
    roundN: number | null = 1
  ) {
    return quantitativeValue?.value != null && quantitativeValue?.unitCode
      ? this.convertNwsRawValueAndUnitCode(
          quantitativeValue.value,
          quantitativeValue.unitCode,
          unitType,
          reqQuery,
          roundN
        )
      : null;
  }

  static getUnitMapping(unitType: UnitType, from: Unit, reqQuery: ReqQuery): UnitMapping {
    const reqToUnit = reqQuery[`${unitType}Unit`];
    return {
      from,
      to: reqToUnit != null ? ((reqToUnit as string).toLowerCase() as Unit) : DEFAULT_UNITS[unitType]
    };
  }

  static getUnitMappings(fromUnits: Record<UnitType, Unit>, reqQuery: ReqQuery) {
    const units = {} as Units;
    for (const _key of Object.keys(fromUnits)) {
      const unitType = _key as UnitType;
      units[unitType] = this.getUnitMapping(unitType, fromUnits[unitType], reqQuery);
    }

    return units;
  }
}
