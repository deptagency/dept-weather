import { Client } from 'weathered';
import { NWS_RECORDING_INTERVAL, NWS_UPLOAD_DELAY } from '../constants';
import { Coordinates, Unit, UnitMapping, UnitType } from '../models';
import { NwsObservations, ReqQuery } from '../models/api';
import { NwsUnits, ObservationResponse, StationsResponse } from '../models/nws';
import { Cached, CacheEntry } from './cached';
import { NumberHelper } from './number-helper';

export class NwsHelper {
  private static readonly userAgent = process.env.NWS_USER_AGENT!;
  private static readonly nws = new Client({ userAgent: NwsHelper.userAgent });

  static async getNearestStation(coordinates: Coordinates) {
    return this.nws.getNearestStation(
      coordinates.latitude,
      coordinates.longitude
    ) as Promise<unknown> as Promise<StationsResponse>;
  }

  private static readonly current = new Cached<ObservationResponse, Coordinates>(
    async (coordinates: Coordinates) =>
      this.nws.getLatestStationObservations(
        (await this.getNearestStation(coordinates)).properties.stationIdentifier
      ) as unknown as ObservationResponse,
    async (newItem: ObservationResponse) => {
      const lastReading = Math.floor(new Date(newItem.properties.timestamp).getTime() / 1_000);
      return lastReading ? lastReading + NWS_RECORDING_INTERVAL + NWS_UPLOAD_DELAY : 0;
    },
    true,
    '[NwsHelper.current]'
  );
  static async getCurrent(coordinates: Coordinates) {
    return this.current.get(`${coordinates.latitude},${coordinates.longitude}`, coordinates);
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
