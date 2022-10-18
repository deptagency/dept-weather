import { Client } from 'weathered';
import {
  AQ_LATITUDE,
  AQ_LONGITUDE,
  NWS_FALLBACK_STATION,
  NWS_RECORDING_INTERVAL,
  NWS_UPLOAD_DELAY
} from '../constants';
import { Unit, UnitMapping, UnitType } from '../models';
import { NwsObservations } from '../models/api';
import { NwsUnits, ObservationResponse, StationsResponse } from '../models/nws';
import { Cached } from './cached';
import { NumberHelper, ReqQuery } from './number-helper';

export class NwsHelper {
  private static readonly userAgent = process.env.NWS_USER_AGENT!;
  private static readonly nws = new Client({ userAgent: NwsHelper.userAgent });

  private static readonly nearestStationPromise = this.nws.getNearestStation(
    AQ_LATITUDE,
    AQ_LONGITUDE
  ) as Promise<unknown> as Promise<StationsResponse>;
  static async getNearestOrFallbackStation() {
    return (await this.nearestStationPromise) ?? NWS_FALLBACK_STATION;
  }

  static readonly current = new Cached<ObservationResponse>(
    async () =>
      this.nws.getLatestStationObservations(
        (await this.getNearestOrFallbackStation()).properties.stationIdentifier
      ) as unknown as ObservationResponse,
    async (newItem: ObservationResponse) => {
      const lastReading = Math.floor(new Date(newItem.properties.timestamp).getTime() / 1_000);
      return lastReading ? lastReading + NWS_RECORDING_INTERVAL + NWS_UPLOAD_DELAY : 0;
    },
    true,
    '[NwsHelper.current]'
  );

  static mapCurrentToNwsObservations(response: ObservationResponse, reqQuery: ReqQuery): NwsObservations {
    const nwsCurrent = response.properties;
    const pressureUnitMapping: UnitMapping = NumberHelper.getUnitMapping(
      UnitType.pressure,
      NwsUnits[nwsCurrent.seaLevelPressure.unitCode],
      reqQuery
    );

    return {
      temperature: NumberHelper.convertNws(nwsCurrent.temperature, UnitType.temp, reqQuery),
      heatIndex: NumberHelper.convertNws(nwsCurrent.heatIndex, UnitType.temp, reqQuery),
      dewPoint: NumberHelper.convertNws(nwsCurrent.dewpoint, UnitType.temp, reqQuery),
      humidity: NumberHelper.roundNws(nwsCurrent.relativeHumidity),
      wind: {
        speed: NumberHelper.convertNws(nwsCurrent.windSpeed, UnitType.distance, reqQuery),
        direction: nwsCurrent.windDirection.value,
        gustSpeed: NumberHelper.convertNws(nwsCurrent.windGust, UnitType.distance, reqQuery)
      },
      pressure: {
        atSeaLevel: NumberHelper.convert(
          nwsCurrent.seaLevelPressure.value,
          pressureUnitMapping,
          pressureUnitMapping.to === Unit.INCHES_OF_MERCURY ? 2 : 1
        )
      },
      textDescription: nwsCurrent.textDescription
    };
  }
}
