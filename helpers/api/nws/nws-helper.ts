import dayjs from 'dayjs';
import fetch, { HeadersInit } from 'node-fetch';
import { NWS_RECORDING_INTERVAL, NWS_UPLOAD_DELAY } from 'constants/server';
import { CoordinatesHelper } from 'helpers';
import { getQueryParamsStr } from 'models/api';
import { MinimalQueriedCity } from 'models/cities';
import {
  AlertsResponse,
  ForecastGridDataResponse,
  ObservationResponse,
  PointsResponse,
  StationsResponse,
  SummaryForecastResponse
} from 'models/nws';
import { Cached, CacheEntry } from '../cached';
import { LoggerHelper } from '../logger-helper';

export class NwsHelper {
  private static readonly CLASS_NAME = 'NwsHelper';
  private static readonly BASE_URL = 'https://api.weather.gov/';
  private static readonly userAgent = process.env.USER_AGENT!;

  private static async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async fetch(url: string, headers?: HeadersInit) {
    return fetch(url, { headers: { ...(headers ?? {}), 'User-Agent': this.userAgent } });
  }

  private static async getItemOnMissWithRetry<ResponseItem>(itemLabel: string, url: string, headers?: HeadersInit) {
    const logger = LoggerHelper.getLogger(`${this.CLASS_NAME}.${itemLabel}`);
    for (let attemptNum = 1; ; attemptNum++) {
      let status: number | undefined;
      let jsonResponse: any;
      try {
        const response = await this.fetch(url, headers);
        status = response.status;
        jsonResponse = await response.json();
        if (status === 200 && jsonResponse?.properties?.periods?.length) {
          if (attemptNum > 1) {
            logger.info(`Attempt #${attemptNum} for ${url} SUCCEEDED`);
          }
          return jsonResponse as ResponseItem;
        }
      } catch {}

      logger.warn(
        `Attempt #${attemptNum} for ${url} FAILED with code ${status} - ${
          jsonResponse != null
            ? `correlationId="${jsonResponse.correlationId}", detail="${jsonResponse.detail}"`
            : 'response was nullish'
        }`
      );
      let numSecondsToWait = Math.pow(2, attemptNum - 1);
      if (numSecondsToWait < 0 || attemptNum === 3) {
        break;
      }
      await this.wait(numSecondsToWait * 1_000);
    }
    logger.error(`All attempts for ${url} FAILED; returning null`);
    return null as unknown as ResponseItem;
  }

  private static readonly points = new Cached<PointsResponse, string>(
    async (coordinatesStr: string) =>
      (await this.fetch(`${this.BASE_URL}points/${coordinatesStr}`)).json() as Promise<PointsResponse>,
    async (_: string, __: PointsResponse) => dayjs().add(1, 'week').unix(),
    LoggerHelper.getLogger(`${this.CLASS_NAME}.points`)
  );
  static async getPoints(coordinatesStr: string) {
    return this.points.get(coordinatesStr, coordinatesStr);
  }

  private static readonly stations = new Cached<StationsResponse, string>(
    async (stationsUrl: string) => (await this.fetch(stationsUrl)).json() as Promise<StationsResponse>,
    async (_: string, __: StationsResponse) => dayjs().add(1, 'week').unix(),
    LoggerHelper.getLogger(`${this.CLASS_NAME}.stations`)
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
      const lastReadingTimestamp = newItem?.properties?.timestamp;
      return lastReadingTimestamp != null
        ? dayjs(lastReadingTimestamp).unix() + NWS_RECORDING_INTERVAL + NWS_UPLOAD_DELAY
        : 0;
    },
    LoggerHelper.getLogger(`${this.CLASS_NAME}.current`)
  );
  static async getCurrent(minQueriedCity: MinimalQueriedCity) {
    const stationId =
      (await this.getNearestStation(CoordinatesHelper.cityToStr(minQueriedCity)))?.properties?.stationIdentifier ?? '';
    return this.current.get(stationId, stationId);
  }

  private static readonly summaryForecast = new Cached<SummaryForecastResponse | null, string>(
    async (summaryForecastUrl: string) =>
      this.getItemOnMissWithRetry('summaryForecast', summaryForecastUrl, {
        'Feature-Flags': 'forecast_temperature_qv,forecast_wind_speed_qv'
      }),
    async (_: string, newItem: SummaryForecastResponse | null) => {
      if (newItem?.properties?.updateTime) {
        const lastReading = dayjs(newItem.properties.updateTime);
        const oneHourFromLastReading = lastReading.add(1, 'hour').unix();
        const fifteenMinsFromNow = dayjs().add(15, 'minutes').unix();
        return Math.max(oneHourFromLastReading, fifteenMinsFromNow);
      }
      return 0;
    },
    LoggerHelper.getLogger(`${this.CLASS_NAME}.summaryForecast`)
  );
  static async getSummaryForecast(points: CacheEntry<PointsResponse>) {
    const summaryForecastUrl = points.item.properties.forecast;
    return this.summaryForecast.get(summaryForecastUrl, summaryForecastUrl);
  }

  private static readonly forecastGridData = new Cached<ForecastGridDataResponse | null, string>(
    async (forecastGridDataUrl: string) => this.getItemOnMissWithRetry('forecastGridData', forecastGridDataUrl),
    async (_: string, newItem: ForecastGridDataResponse | null) => {
      if (newItem?.properties?.updateTime) {
        // TODO - come up with actual logic for calculating numerical forecast expiration
        return dayjs().add(5, 'minute').unix();
      }
      return 0;
    },
    LoggerHelper.getLogger(`${this.CLASS_NAME}.forecastGridData`)
  );
  static async getForecastGridData(points: CacheEntry<PointsResponse>) {
    const forecastGridDataUrl = points.item.properties.forecastGridData;
    return this.forecastGridData.get(forecastGridDataUrl, forecastGridDataUrl);
  }

  static async getAlerts(minQueriedCity: MinimalQueriedCity): Promise<AlertsResponse> {
    const coordinatesStr = CoordinatesHelper.cityToStr(minQueriedCity);
    return (await (
      await this.fetch(`${this.BASE_URL}alerts/active${getQueryParamsStr({ point: coordinatesStr })}`)
    ).json()) as AlertsResponse;
  }
}
