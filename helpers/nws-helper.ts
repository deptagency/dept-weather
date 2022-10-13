import { Client, ObservationResponse as WeatheredObservationResponse } from 'weathered';
import {
  AQ_LATITUDE,
  AQ_LONGITUDE,
  NWS_FALLBACK_STATION,
  NWS_RECORDING_INTERVAL,
  NWS_UPLOAD_DELAY
} from '../constants';
import { Cached } from './cached';

type ObservationResponse = WeatheredObservationResponse & { properties: { timestamp: string } };

export class NwsHelper {
  private static readonly userAgent = process.env.NWS_USER_AGENT!;
  private static readonly nws = new Client({ userAgent: NwsHelper.userAgent });

  private static readonly getNearestStationPromise = this.nws.getNearestStation(AQ_LATITUDE, AQ_LONGITUDE);
  static async getNearestStation() {
    return (await this.getNearestStationPromise) ?? NWS_FALLBACK_STATION;
  }

  static readonly current = new Cached<ObservationResponse>(
    async () =>
      this.nws.getLatestStationObservations(
        (await this.getNearestStation()).properties.stationIdentifier
      ) as unknown as ObservationResponse,
    async (newItem: ObservationResponse) => {
      const lastReading = Math.floor(new Date(newItem.properties.timestamp).getTime() / 1_000);
      return lastReading ? lastReading + NWS_RECORDING_INTERVAL + NWS_UPLOAD_DELAY : 0;
    },
    true,
    '[NwsHelper.current] '
  );
}
