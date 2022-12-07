import dayjs, { Dayjs } from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import fetch, { HeadersInit } from 'node-fetch';
import { NWS_RECORDING_INTERVAL, NWS_UPLOAD_DELAY } from '@constants';
import { CoordinatesHelper, NumberHelper } from 'helpers';
import { Unit, UnitType } from 'models';
import {
  DescriptionItem,
  getQueryParamsStr,
  NwsAlert,
  NwsAlerts,
  NwsForecast,
  NwsForecastPeriod,
  NwsObservations,
  ReqQuery,
  WindForecast
} from 'models/api';
import { MinimalQueriedCity } from 'models/cities';
import {
  AlertsResponse,
  ForecastPeriod,
  ForecastResponse,
  NwsUnits,
  ObservationResponse,
  PointsResponse,
  QuantitativeMinMaxValue,
  QuantitativeValue,
  StationsResponse
} from 'models/nws';
import { Cached, CacheEntry } from './cached';
import { FeelsHelper } from './feels-helper';
import { LoggerHelper } from './logger-helper';

dayjs.extend(localeData);

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

  static mapCurrentToNwsObservations(cacheEntry: CacheEntry<ObservationResponse>, reqQuery: ReqQuery): NwsObservations {
    const nwsCurrent = cacheEntry.item?.properties;
    const pressureUnitMapping = nwsCurrent?.seaLevelPressure?.unitCode
      ? NumberHelper.getUnitMapping(UnitType.pressure, NwsUnits[nwsCurrent.seaLevelPressure.unitCode], reqQuery)
      : null;

    return {
      readTime: nwsCurrent?.timestamp ? dayjs(nwsCurrent.timestamp).unix() : 0,
      validUntil: cacheEntry.validUntil,
      temperature: NumberHelper.convertNws(nwsCurrent?.temperature, UnitType.temp, reqQuery),
      feelsLike: FeelsHelper.getFromNwsObservations(nwsCurrent, reqQuery),
      heatIndex: NumberHelper.convertNws(nwsCurrent?.heatIndex, UnitType.temp, reqQuery),
      dewPoint: NumberHelper.convertNws(nwsCurrent?.dewpoint, UnitType.temp, reqQuery),
      humidity: NumberHelper.roundNws(nwsCurrent?.relativeHumidity),
      wind: {
        speed: NumberHelper.convertNws(nwsCurrent?.windSpeed, UnitType.wind, reqQuery),
        directionDeg: nwsCurrent?.windDirection?.value,
        gustSpeed: NumberHelper.convertNws(nwsCurrent?.windGust, UnitType.wind, reqQuery)
      },
      pressure: {
        atSeaLevel: NumberHelper.convert(
          nwsCurrent?.seaLevelPressure?.value,
          pressureUnitMapping,
          pressureUnitMapping?.to === Unit.INCHES ? 2 : 1
        )
      },
      precipitation: {
        last1Hrs: NumberHelper.convertNws(nwsCurrent?.precipitationLastHour, UnitType.precipitation, reqQuery, 2),
        last3Hrs: NumberHelper.convertNws(nwsCurrent?.precipitationLast3Hours, UnitType.precipitation, reqQuery, 2),
        last6Hrs: NumberHelper.convertNws(nwsCurrent?.precipitationLast6Hours, UnitType.precipitation, reqQuery, 2)
      },
      textDescription: nwsCurrent?.textDescription ?? null
    };
  }

  private static readonly forecast = new Cached<ForecastResponse, string>(
    async (forecastUrl: string) => {
      const forecastLogger = LoggerHelper.getLogger(`${this.CLASS_NAME}.forecast`);
      for (let attemptNum = 1; ; attemptNum++) {
        let status: number | undefined;
        let jsonResponse: any;
        try {
          const response = await this.fetch(forecastUrl, {
            'Feature-Flags': 'forecast_temperature_qv,forecast_wind_speed_qv'
          });
          status = response.status;
          jsonResponse = await response.json();
          if (status === 200 && jsonResponse?.properties?.periods?.length) {
            if (attemptNum > 1) {
              forecastLogger.info(`Attempt #${attemptNum} for ${forecastUrl} SUCCEEDED`);
            }
            return jsonResponse as ForecastResponse;
          }
        } catch {}

        forecastLogger.warn(
          `Attempt #${attemptNum} for ${forecastUrl} FAILED with code ${status} - ${
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
      forecastLogger.error(`All attempts for ${forecastUrl} FAILED; returning null`);
      return null as unknown as ForecastResponse;
    },
    async (_: string, newItem: any) => {
      const lastReading = dayjs(newItem.properties.updateTime);
      const oneHourFromLastReading = lastReading.add(1, 'hour').unix();
      const fifteenMinsFromNow = dayjs().add(15, 'minutes').unix();
      return Math.max(oneHourFromLastReading, fifteenMinsFromNow);
    },
    LoggerHelper.getLogger(`${this.CLASS_NAME}.forecast`)
  );
  static async getForecast(minQueriedCity: MinimalQueriedCity) {
    const points = await this.getPoints(CoordinatesHelper.cityToStr(minQueriedCity));
    const forecastUrl = points.item.properties.forecast;
    return this.forecast.get(forecastUrl, forecastUrl);
  }

  static mapForecastToNwsForecast(cacheEntry: CacheEntry<ForecastResponse>, reqQuery: ReqQuery): NwsForecast {
    const forecast = cacheEntry.item?.properties;

    const getWind = (period: ForecastPeriod): WindForecast => {
      let wind: WindForecast = {
        speed: null,
        minSpeed: null,
        maxSpeed: null,
        gustSpeed: null,
        minGustSpeed: null,
        maxGustSpeed: null,
        direction: period.windDirection
      };

      const speedAsMinMax = period.windSpeed as QuantitativeMinMaxValue;
      const speedAsValue = period.windSpeed as QuantitativeValue;
      if (speedAsMinMax?.minValue != null && speedAsMinMax?.maxValue != null) {
        wind.minSpeed = NumberHelper.convertNwsRawValueAndUnitCode(
          speedAsMinMax.minValue,
          speedAsMinMax.unitCode,
          UnitType.wind,
          reqQuery
        );
        wind.maxSpeed = NumberHelper.convertNwsRawValueAndUnitCode(
          speedAsMinMax.maxValue,
          speedAsMinMax.unitCode,
          UnitType.wind,
          reqQuery
        );
      } else if (speedAsValue?.value != null) {
        wind.speed = NumberHelper.convertNws(speedAsValue, UnitType.wind, reqQuery);
      }

      const gustSpeedAsMinMax = period.windGust as QuantitativeMinMaxValue;
      const gustSpeedAsValue = period.windGust as QuantitativeValue;
      if (gustSpeedAsMinMax?.minValue != null && gustSpeedAsMinMax?.maxValue != null) {
        wind.minGustSpeed = NumberHelper.convertNwsRawValueAndUnitCode(
          gustSpeedAsMinMax.minValue,
          gustSpeedAsMinMax.unitCode,
          UnitType.wind,
          reqQuery
        );
        wind.maxGustSpeed = NumberHelper.convertNwsRawValueAndUnitCode(
          gustSpeedAsMinMax.maxValue,
          gustSpeedAsMinMax.unitCode,
          UnitType.wind,
          reqQuery
        );
      } else if (gustSpeedAsValue?.value != null) {
        wind.gustSpeed = NumberHelper.convertNws(gustSpeedAsValue, UnitType.wind, reqQuery);
      }

      return wind;
    };

    const isTimeBeforeEndOfDay = (time: Dayjs) => time.isBefore(dayjs().endOf('day'));

    const forecasts =
      forecast?.periods?.map((period): NwsForecastPeriod => {
        const start = dayjs(period.startTime);
        let dayName = dayjs.weekdays()[start.day()];
        if (isTimeBeforeEndOfDay(start)) {
          if (period.isDaytime) dayName = 'Today';
          else if (isTimeBeforeEndOfDay(dayjs(period.endTime))) dayName = 'Overnight';
          else dayName = 'Tonight';
        }

        return {
          dayName,
          shortDateName: start.format('MMM D'),
          periodStart: start.unix(),
          periodEnd: dayjs(period.endTime).unix(),
          isDaytime: period.isDaytime,
          temperature: NumberHelper.convertNws(period.temperature, UnitType.temp, reqQuery),
          wind: getWind(period),
          shortForecast: period.shortForecast,
          detailedForecast: period.detailedForecast
        };
      }) ?? [];

    return {
      readTime: forecast?.updateTime ? dayjs(forecast.updateTime).unix() : 0,
      validUntil: cacheEntry.validUntil,
      forecasts
    };
  }

  static async getAlerts(minQueriedCity: MinimalQueriedCity) {
    const coordinatesStr = CoordinatesHelper.cityToStr(minQueriedCity);
    const alertsResponse = await this.fetch(
      `${this.BASE_URL}alerts/active${getQueryParamsStr({ point: coordinatesStr })}`
    );
    return alertsResponse.json() as Promise<AlertsResponse>;
  }

  static mapAlertsToNwsAlerts(alertsResp: AlertsResponse): NwsAlerts {
    const alerts = alertsResp.features
      .filter(alert => dayjs(alert.properties.expires).isAfter(dayjs()))
      .map((alert): NwsAlert => {
        const rawDescription = alert.properties.description;
        const splitRawDescriptionOn = rawDescription.includes('\n\n') ? '\n\n' : '\n';
        const description = rawDescription.split(splitRawDescriptionOn).map((descItemStr): DescriptionItem => {
          const normDescItemStr = descItemStr.replaceAll('\n', ' ');
          const headingExecd = /(\w+( +\w+)*)(?=\.{3})/.exec(normDescItemStr);
          const bodyExecd = /(?<=\.{3})(.*)/m.exec(normDescItemStr);

          let heading = headingExecd && headingExecd.length > 0 ? headingExecd[0].toUpperCase() : undefined;
          let body = bodyExecd && bodyExecd.length > 0 ? bodyExecd[0] : undefined;
          return heading != null && body != null
            ? {
                heading,
                body
              }
            : { body: normDescItemStr };
        });
        const instruction =
          alert.properties.instruction?.split('\n\n')?.map(insParagraph => insParagraph.replaceAll('\n', ' ')) ?? [];

        return {
          effective: dayjs(alert.properties.effective).unix(),
          expires: dayjs(alert.properties.expires).unix(),
          severity: alert.properties.severity,
          senderName: alert.properties.senderName,
          title: alert.properties.event,
          description,
          instruction
        };
      });

    return {
      readTime: dayjs(alertsResp.updated).unix(),
      alerts
    };
  }
}
