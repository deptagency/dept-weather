import { Client } from 'weathered';
import { NWS_RECORDING_INTERVAL, NWS_UPLOAD_DELAY } from '../constants';
import { Unit, UnitMapping, UnitType } from '../models';
import { NwsObservations, ReqQuery } from '../models/api';
import { NwsUnits, ObservationResponse, StationsResponse } from '../models/nws';
import { Cached, CacheEntry } from './cached';
import { CoordinatesHelper } from './coordinates-helper';
import { NumberHelper } from './number-helper';

export class NwsHelper {
  private static readonly userAgent = process.env.USER_AGENT!;
  private static readonly nws = new Client({ userAgent: NwsHelper.userAgent });

  static async getNearestStation(coordinatesStr: string) {
    const coordinatesNumArr = CoordinatesHelper.strToNumArr(coordinatesStr);
    return this.nws.getNearestStation(
      coordinatesNumArr[0],
      coordinatesNumArr[1]
    ) as Promise<unknown> as Promise<StationsResponse>;
  }

  private static readonly current = new Cached<ObservationResponse, string>(
    async (coordinatesStr: string) =>
      this.nws.getLatestStationObservations(
        (await this.getNearestStation(coordinatesStr)).properties.stationIdentifier
      ) as unknown as ObservationResponse,
    async (_: string, newItem: ObservationResponse) => {
      const lastReading = Math.floor(new Date(newItem.properties.timestamp).getTime() / 1_000);
      return lastReading ? lastReading + NWS_RECORDING_INTERVAL + NWS_UPLOAD_DELAY : 0;
    },
    true,
    '[NwsHelper.current]'
  );
  static async getCurrent(coordinatesStr: string) {
    return this.current.get(coordinatesStr, coordinatesStr);
  }

  static mapCurrentToNwsObservations(cacheEntry: CacheEntry<ObservationResponse>, reqQuery: ReqQuery): NwsObservations {
    const nwsCurrent = cacheEntry.item.properties;
    const pressureUnitMapping: UnitMapping = NumberHelper.getUnitMapping(
      UnitType.pressure,
      NwsUnits[nwsCurrent.seaLevelPressure.unitCode],
      reqQuery
    );

    return {
      readTime: Math.floor(new Date(nwsCurrent.timestamp).getTime() / 1_000),
      validUntil: cacheEntry.validUntil,
      temperature: NumberHelper.convertNws(nwsCurrent.temperature, UnitType.temp, reqQuery),
      heatIndex: NumberHelper.convertNws(nwsCurrent.heatIndex, UnitType.temp, reqQuery),
      dewPoint: NumberHelper.convertNws(nwsCurrent.dewpoint, UnitType.temp, reqQuery),
      humidity: NumberHelper.roundNws(nwsCurrent.relativeHumidity),
      wind: {
        speed: NumberHelper.convertNws(nwsCurrent.windSpeed, UnitType.wind, reqQuery),
        direction: nwsCurrent.windDirection.value,
        gustSpeed: NumberHelper.convertNws(nwsCurrent.windGust, UnitType.wind, reqQuery)
      },
      pressure: {
        atSeaLevel: NumberHelper.convert(
          nwsCurrent.seaLevelPressure.value,
          pressureUnitMapping,
          pressureUnitMapping.to === Unit.INCHES ? 2 : 1
        )
      },
      precipitation: {
        last1Hrs: NumberHelper.convertNws(nwsCurrent.precipitationLastHour, UnitType.precipitation, reqQuery, 2),
        last3Hrs: NumberHelper.convertNws(nwsCurrent.precipitationLast3Hours, UnitType.precipitation, reqQuery, 2),
        last6Hrs: NumberHelper.convertNws(nwsCurrent.precipitationLast6Hours, UnitType.precipitation, reqQuery, 2)
      },
      textDescription: nwsCurrent.textDescription
    };
  }
}
