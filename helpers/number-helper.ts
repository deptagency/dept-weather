import { DEFAULT_UNITS } from '../constants';
import { Unit, UnitMapping, Units, UnitType } from '../models';
import { ReqQuery } from '../models/api';
import { NwsUnits, QuantitativeValue } from '../models/nws';

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
    },
    [Unit.PASCAL]: {
      [Unit.INCHES]: (value: number) => value / 3386,
      [Unit.MILLIBAR]: (value: number) => value / 100
    },
    [Unit.MILLIBAR]: {
      [Unit.PASCAL]: (value: number) => value * 100,
      [Unit.INCHES]: (value: number) => value / 33.864
    },
    [Unit.INCHES]: {
      [Unit.PASCAL]: (value: number) => value * 3386,
      [Unit.MILLIBAR]: (value: number) => value * 33.864,
      [Unit.METERS]: (value: number) => value / 39.37,
      [Unit.MILLIMETERS]: (value: number) => value * 25.4
    },
    [Unit.METERS]: {
      [Unit.INCHES]: (value: number) => value * 39.37,
      [Unit.MILLIMETERS]: (value: number) => value * 1000
    },
    [Unit.MILLIMETERS]: {
      [Unit.INCHES]: (value: number) => value / 25.4,
      [Unit.METERS]: (value: number) => value / 1000
    }
  } as Record<Unit, Record<Unit, (value: number) => number>>;

  static round(value: number | null, n: number | undefined = 1, method: 'floor' | 'ceil' | 'round' = 'round') {
    if (value == null) {
      return null;
    }
    if (n === undefined) {
      return value;
    }

    const multiple = n === 0 ? 1 : Math.pow(10, n);
    const x = value * multiple;
    let roundedX: number;
    if (method === 'floor') {
      roundedX = Math.floor(x);
    } else if (method === 'ceil') {
      roundedX = Math.ceil(x);
    } else {
      roundedX = Math.round(x);
    }

    return roundedX / multiple;
  }

  static roundNws(quantitativeValue: QuantitativeValue, n: number | undefined = 1) {
    return this.round(quantitativeValue.value, n);
  }

  static convert(value: number | null, unitMapping: UnitMapping, roundN: number | undefined = 1) {
    if (value == null) {
      return null;
    }

    const convertedValue =
      unitMapping.from === unitMapping.to ? value : this.CONVERSION_MAP[unitMapping.from][unitMapping.to](value);
    return this.round(convertedValue, roundN);
  }

  static convertNws(
    quantitativeValue: QuantitativeValue,
    unitType: UnitType,
    reqQuery: ReqQuery,
    roundN: number | undefined = 1
  ) {
    return this.convert(
      quantitativeValue.value,
      this.getUnitMapping(unitType, NwsUnits[quantitativeValue.unitCode], reqQuery),
      roundN
    );
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
