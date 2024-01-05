import {
  NWS_OBSERVATIONS_STALE_AFTER_MINUTES,
  NWS_OBSERVATIONS_UNUSABLE_AFTER_MINUTES,
  NWS_RECORDING_INTERVAL
} from 'constants/server';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import geodist from 'geodist';
import { Cached, CacheEntry } from 'helpers/api/cached';
import { LoggerHelper } from 'helpers/api/logger-helper';
import { CoordinatesHelper } from 'helpers/coordinates-helper';
import { NumberHelper } from 'helpers/number-helper';
import { getQueryParamsStr } from 'models/api/api-route.model';
import { MinimalQueriedCity } from 'models/cities/cities.model';
import { AlertsResponse } from 'models/nws/alerts.model';
import { ForecastGridDataResponse } from 'models/nws/forecast-grid-data.model';
import { ObservationResponse } from 'models/nws/observation.model';
import { PointsResponse } from 'models/nws/points.model';
import { Feature as StationFeature, StationsResponse } from 'models/nws/stations.model';
import { SummaryForecastResponse } from 'models/nws/summary-forecast.model';
import { Unit } from 'models/unit.enum';

dayjs.extend(duration);

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

  private static async getItemOnMissWithRetry<ResponseItem>(
    itemLabel: string,
    isResponseOk: (jsonResponse: any) => boolean,
    url: string,
    headers?: HeadersInit
  ) {
    const logger = LoggerHelper.getLogger(`${this.CLASS_NAME}.${itemLabel}`);
    for (let attemptNum = 1; ; attemptNum++) {
      let status: number | undefined;
      let jsonResponse: any;
      try {
        const response = await this.fetch(url, headers);
        status = response.status;
        jsonResponse = await response.json();
        if (status === 200 && isResponseOk(jsonResponse)) {
          if (attemptNum > 1) {
            logger.info(`Attempt #${attemptNum} for ${url} SUCCEEDED`);
          }
          return jsonResponse as ResponseItem;
        }
      } catch {
        /* empty */
      }

      logger.warn(
        `Attempt #${attemptNum} for ${url} FAILED with code ${status} - ${
          jsonResponse != null
            ? `correlationId="${jsonResponse.correlationId}", detail="${jsonResponse.detail}"`
            : 'response was nullish'
        }`
      );
      const numSecondsToWait = Math.pow(2, attemptNum - 1);
      if (numSecondsToWait < 0 || attemptNum === 3) {
        break;
      }
      await this.wait(numSecondsToWait * 1_000);
    }
    logger.error(`All attempts for ${url} FAILED; returning null`);
    return null as unknown as ResponseItem;
  }

  private static readonly points = new Cached<PointsResponse | undefined, string>(
    async (coordinatesStr: string) => {
      let pointsResp: PointsResponse | undefined;
      try {
        pointsResp = await (await this.fetch(`${this.BASE_URL}points/${coordinatesStr}`)).json();
      } catch (err) {
        LoggerHelper.getLogger(`${this.CLASS_NAME}.points.getItemOnMiss()`).error(`Couldn't fetch due to an exception`);
        console.error(err);
      }
      return pointsResp;
    },
    async () => dayjs().add(1, 'week').unix(),
    LoggerHelper.getLogger(`${this.CLASS_NAME}.points`)
  );
  static async getPoints(coordinatesStr: string) {
    return this.points.get(coordinatesStr, coordinatesStr);
  }

  private static readonly stations = new Cached<StationsResponse | undefined, string>(
    async (stationsUrl: string) => {
      let stationsResp: StationsResponse | undefined;
      try {
        stationsResp = await (await this.fetch(stationsUrl)).json();
      } catch (err) {
        LoggerHelper.getLogger(`${this.CLASS_NAME}.stations.getItemOnMiss()`).error(
          `Couldn't fetch due to an exception`
        );
        console.error(err);
      }
      return stationsResp;
    },
    async () => dayjs().add(1, 'week').unix(),
    LoggerHelper.getLogger(`${this.CLASS_NAME}.stations`)
  );
  private static async getStations(coordinatesStr: string) {
    const points = await this.getPoints(coordinatesStr);
    const stationsUrl = points.item?.properties?.observationStations;
    return stationsUrl
      ? this.stations.get(stationsUrl, stationsUrl)
      : {
          item: undefined,
          validUntil: 0,
          key: ''
        };
  }

  private static readonly current = new Cached<ObservationResponse | undefined, string>(
    async (stationId: string) => {
      let observationsResp: ObservationResponse | undefined;
      try {
        observationsResp = await (await this.fetch(`${this.BASE_URL}stations/${stationId}/observations/latest`)).json();
      } catch (err) {
        LoggerHelper.getLogger(`${this.CLASS_NAME}.current.getItemOnMiss()`).error(
          `Couldn't fetch due to an exception`
        );
        console.error(err);
      }
      return observationsResp;
    },
    async (_: string, newItem: ObservationResponse | undefined) => {
      const lastReadingTimestamp = newItem?.properties?.timestamp;
      return lastReadingTimestamp != null ? dayjs(lastReadingTimestamp).unix() + NWS_RECORDING_INTERVAL : 0;
    },
    LoggerHelper.getLogger(`${this.CLASS_NAME}.current`)
  );
  static async getCurrent(minQueriedCity: MinimalQueriedCity) {
    const acceptableStations: { stationId: string; distanceFromQueried: number }[] = [];

    const stationsResp = await this.getStations(CoordinatesHelper.cityToStr(minQueriedCity));
    if (stationsResp.item?.features?.length) {
      const queriedCityCoordinates = CoordinatesHelper.cityToNumArr(minQueriedCity);
      const getDistanceFromQueried = (station: StationFeature) => {
        try {
          const stationCoordinates = [...(station.geometry.coordinates as number[])].reverse();
          return geodist(queriedCityCoordinates, stationCoordinates, {
            exact: true,
            unit: Unit.MILES
          });
        } catch {
          /* empty */
        }
      };

      // Set maxAcceptableStationDistance to distanceToClosestStation + 25
      let maxAcceptableStationDistance;
      for (let i = 0; i < stationsResp.item.features.length; i++) {
        const distanceFromQueried = getDistanceFromQueried(stationsResp.item.features[i]);
        if (distanceFromQueried != null) {
          if (maxAcceptableStationDistance == null) {
            maxAcceptableStationDistance = distanceFromQueried + 25;
          }
          if (distanceFromQueried <= maxAcceptableStationDistance && acceptableStations.length < 3) {
            acceptableStations.push({
              stationId: stationsResp.item.features[i].properties.stationIdentifier,
              distanceFromQueried: NumberHelper.round(distanceFromQueried, 2)!
            });
          } else break;
        }
      }
    }

    // Fallback; the most recent observations that are stale but usable
    let bestUsableObservations:
      | {
          stationId: string;
          cacheEntry: CacheEntry<ObservationResponse | undefined>;
          minutesSinceLastReadTime: number;
        }
      | undefined;

    for (let i = 0; i < acceptableStations.length; i++) {
      const currentForStation = await this.current.get(
        acceptableStations[i].stationId,
        acceptableStations[i].stationId
      );
      const lastReadingTimestamp = currentForStation.item?.properties?.timestamp;
      const lastReadTime = lastReadingTimestamp != null ? dayjs(lastReadingTimestamp) : dayjs(0);
      const durationSinceLastReadTime = dayjs.duration(dayjs().diff(lastReadTime));
      if (durationSinceLastReadTime.asMinutes() < NWS_OBSERVATIONS_STALE_AFTER_MINUTES) {
        if (i > 0) {
          LoggerHelper.getLogger(`${this.CLASS_NAME}.getCurrent()`).info(
            `${acceptableStations[i].stationId} station has fresh alternative observations, using... `
          );
        }
        return currentForStation;
      } else if (
        durationSinceLastReadTime.asMinutes() < NWS_OBSERVATIONS_UNUSABLE_AFTER_MINUTES &&
        (bestUsableObservations == null ||
          durationSinceLastReadTime.asMinutes() < bestUsableObservations.minutesSinceLastReadTime)
      ) {
        bestUsableObservations = {
          stationId: acceptableStations[i].stationId,
          cacheEntry: currentForStation,
          minutesSinceLastReadTime: durationSinceLastReadTime.asMinutes()
        };
      }

      LoggerHelper.getLogger(`${this.CLASS_NAME}.getCurrent()`).info(
        `${acceptableStations[i].stationId} station has ${
          durationSinceLastReadTime.asMinutes() > NWS_OBSERVATIONS_UNUSABLE_AFTER_MINUTES ? 'unusable' : 'stale'
        } observations - ${Math.round(durationSinceLastReadTime.asMinutes())} minutes since last update`
      );
    }

    if (bestUsableObservations) {
      LoggerHelper.getLogger(`${this.CLASS_NAME}.getCurrent()`).info(
        `${bestUsableObservations.stationId} station has best usable observations, using... `
      );
      return bestUsableObservations.cacheEntry;
    }

    return {
      item: undefined,
      validUntil: 0,
      key: ''
    };
  }

  private static async forecastCalculateExpiration(
    _: string,
    newItem: SummaryForecastResponse | ForecastGridDataResponse | null
  ) {
    if (newItem?.properties?.updateTime) {
      const lastReading = dayjs(newItem.properties.updateTime);
      const oneHourFromLastReading = lastReading.add(1, 'hour').unix();
      const fifteenMinsFromNow = dayjs().add(15, 'minutes').unix();
      return Math.max(oneHourFromLastReading, fifteenMinsFromNow);
    }
    return 0;
  }

  private static readonly summaryForecast = new Cached<SummaryForecastResponse | null, string>(
    async (summaryForecastUrl: string) =>
      this.getItemOnMissWithRetry(
        'summaryForecast',
        jsonResponse => jsonResponse?.properties?.periods?.length,
        summaryForecastUrl,
        {
          'Feature-Flags': 'forecast_temperature_qv,forecast_wind_speed_qv'
        }
      ),
    this.forecastCalculateExpiration,
    LoggerHelper.getLogger(`${this.CLASS_NAME}.summaryForecast`)
  );
  static async getSummaryForecast(points: CacheEntry<PointsResponse | undefined>) {
    const summaryForecastUrl = points.item!.properties.forecast;
    return this.summaryForecast.get(summaryForecastUrl, summaryForecastUrl);
  }

  private static readonly forecastGridData = new Cached<ForecastGridDataResponse | null, string>(
    async (forecastGridDataUrl: string) =>
      this.getItemOnMissWithRetry(
        'forecastGridData',
        jsonResponse => jsonResponse?.properties?.updateTime,
        forecastGridDataUrl
      ),
    this.forecastCalculateExpiration,
    LoggerHelper.getLogger(`${this.CLASS_NAME}.forecastGridData`)
  );
  static async getForecastGridData(points: CacheEntry<PointsResponse | undefined>) {
    const forecastGridDataUrl = points.item!.properties.forecastGridData;
    return this.forecastGridData.get(forecastGridDataUrl, forecastGridDataUrl);
  }

  static async getAlerts(minQueriedCity: MinimalQueriedCity): Promise<AlertsResponse> {
    const coordinatesStr = CoordinatesHelper.cityToStr(minQueriedCity);
    return (await (
      await this.fetch(`${this.BASE_URL}alerts/active${getQueryParamsStr({ point: coordinatesStr })}`)
    ).json()) as AlertsResponse;
  }
}
