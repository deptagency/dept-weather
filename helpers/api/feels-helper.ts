import Feels from 'feels';
import { FEELS_UNITS } from 'constants/server';
import { NumberHelper } from 'helpers';
import { Unit, UnitType } from 'models';
import { ReqQuery } from 'models/api';
import { Observation } from 'models/nws';
import { LoggerHelper } from './logger-helper';

export class FeelsHelper {
  private static readonly CLASS_NAME = 'FeelsHelper';

  private static getFeelsUnitReqQuery() {
    const feelsUnitsReqQuery: Record<string, Unit> = {};
    for (const unitType of Object.keys(FEELS_UNITS)) {
      feelsUnitsReqQuery[`${unitType}Unit`] = FEELS_UNITS[unitType as UnitType];
    }
    return feelsUnitsReqQuery;
  }

  static getFromNwsObservations(nwsCurrent: Observation, reqQuery: ReqQuery) {
    let feelsLike: number | null = null;

    const feelsUnitsReqQuery = this.getFeelsUnitReqQuery();

    // Convert wind speed to meters per hour, and then to meters per second
    const metersPerHourSpeed = NumberHelper.convertNws(nwsCurrent?.windSpeed, UnitType.wind, feelsUnitsReqQuery, 0);
    const speed = metersPerHourSpeed != null ? metersPerHourSpeed / (60 * 60) : null;

    const feelsOpts = {
      temp: NumberHelper.convertNws(nwsCurrent?.temperature, UnitType.temp, feelsUnitsReqQuery, 0),
      speed,
      humidity: nwsCurrent?.relativeHumidity?.value,
      dewPoint: NumberHelper.convertNws(nwsCurrent?.dewpoint, UnitType.temp, feelsUnitsReqQuery, 0),
      round: false
    };
    const feels = new Feels(feelsOpts);

    const tempUnitMapping = NumberHelper.getUnitMapping(UnitType.temp, FEELS_UNITS.temp, reqQuery);
    try {
      const _feelsLike = feels.like(['AWBGT', 'HI', 'HI_CA', 'WCI']);
      feelsLike = NumberHelper.convert(_feelsLike, tempUnitMapping);
    } catch (err) {
      LoggerHelper.getLogger(`${this.CLASS_NAME}.getFromNwsObservations()`).warn(
        `Couldn't calculate feels like temperature - ${err} - opts were: ${JSON.stringify(feelsOpts)}"`
      );
    }

    return feelsLike;
  }
}
