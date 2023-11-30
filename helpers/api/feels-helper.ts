import { FEELS_UNITS } from 'constants/server';
import Feels from 'feels';
import { LoggerHelper } from 'helpers/api/logger-helper';
import { NumberHelper } from 'helpers/number-helper';
import { ReqQuery } from 'models/api/req-query.model';
import { Observation } from 'models/nws/observation.model';
import { UnitType } from 'models/unit.enum';

export class FeelsHelper {
  private static readonly CLASS_NAME = 'FeelsHelper';

  static getFromNwsObservations(nwsCurrent: Observation, reqQuery: ReqQuery) {
    let feelsLike: number | null = null;

    // Convert wind speed to meters per hour, and then to meters per second
    const metersPerHourSpeed =
      NumberHelper.convertNws(nwsCurrent?.windSpeed, UnitType.wind, FEELS_UNITS, 0) ??
      NumberHelper.convertNws(nwsCurrent?.windGust, UnitType.wind, FEELS_UNITS, 0);
    const speed = metersPerHourSpeed != null ? metersPerHourSpeed / (60 * 60) : null;

    const feelsOpts = {
      temp: NumberHelper.convertNws(nwsCurrent?.temperature, UnitType.temp, FEELS_UNITS, 0),
      speed,
      humidity: nwsCurrent?.relativeHumidity?.value,
      dewPoint: NumberHelper.convertNws(nwsCurrent?.dewpoint, UnitType.temp, FEELS_UNITS, 0),
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
