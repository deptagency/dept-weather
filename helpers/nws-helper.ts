import dayjs from 'dayjs';
import fetch from 'node-fetch';
import { NWS_RECORDING_INTERVAL, NWS_UPLOAD_DELAY } from '../constants';
import { Unit, UnitMapping, UnitType } from '../models';
import { NwsObservations, ReqQuery } from '../models/api';
import { NwsUnits, ObservationResponse, PointsResponse, StationsResponse } from '../models/nws';
import { Cached, CacheEntry } from './cached';
import { NumberHelper } from './number-helper';

export class NwsHelper {
  private static readonly BASE_URL = 'https://api.weather.gov/';
  private static readonly userAgent = process.env.USER_AGENT!;

  private static async fetch(url: string) {
    return fetch(url, { headers: { 'User-Agent': this.userAgent } });
  }

  private static readonly points = new Cached<PointsResponse, string>(
    async (coordinatesStr: string) =>
      (await this.fetch(`${this.BASE_URL}points/${coordinatesStr}`)).json() as Promise<PointsResponse>,
    async (_: string, __: PointsResponse) => dayjs().add(1, 'week').unix(),
    true,
    '[NwsHelper.points]'
  );
  private static async getPoints(coordinatesStr: string) {
    return this.points.get(coordinatesStr, coordinatesStr);
  }

  private static readonly stations = new Cached<StationsResponse, string>(
    async (stationsUrl: string) => (await this.fetch(stationsUrl)).json() as Promise<StationsResponse>,
    async (_: string, __: StationsResponse) => dayjs().add(1, 'week').unix(),
    true,
    '[NwsHelper.stations]'
  );
  private static async getStations(coordinatesStr: string) {
    const points = await this.getPoints(coordinatesStr);
    const stationsUrl = points.item.properties.observationStations;
    return this.stations.get(stationsUrl, stationsUrl);
  }

  private static async getNearestStation(coordinatesStr: string) {
    const stations = await this.getStations(coordinatesStr);
    return stations.item?.features?.length ? stations.item.features[0] : null;
  }

  private static readonly current = new Cached<ObservationResponse, string>(
    async (stationId: string) =>
      (
        await this.fetch(`${this.BASE_URL}stations/${stationId}/observations/latest`)
      ).json() as Promise<ObservationResponse>,
    async (_: string, newItem: ObservationResponse) => {
      const lastReading = Math.floor(new Date(newItem.properties.timestamp).getTime() / 1_000);
      return lastReading ? lastReading + NWS_RECORDING_INTERVAL + NWS_UPLOAD_DELAY : 0;
    },
    true,
    '[NwsHelper.current]'
  );
  static async getCurrent(coordinatesStr: string) {
    const stationId = (await this.getNearestStation(coordinatesStr))?.properties?.stationIdentifier ?? '';
    return this.current.get(stationId, stationId);
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
