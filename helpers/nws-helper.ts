import { Client } from 'weathered';
import {
  AQ_LATITUDE,
  AQ_LONGITUDE,
  NWS_FALLBACK_STATION,
  NWS_RECORDING_INTERVAL,
  NWS_UPLOAD_DELAY
} from '../constants';
import { ObservationResponse, StationsResponse } from '../models/nws';
import { Cached } from './cached';

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
    '[NwsHelper.current] '
  );
}
