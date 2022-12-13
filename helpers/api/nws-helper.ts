import dayjs, { Dayjs } from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localeData from 'dayjs/plugin/localeData';
import timezone from 'dayjs/plugin/timezone';
import fetch, { HeadersInit } from 'node-fetch';
import { NWS_RECORDING_INTERVAL, NWS_UPLOAD_DELAY } from 'constants/server';
import { CoordinatesHelper, NumberHelper } from 'helpers';
import { DetailedWindDirection, Unit, UnitType, WindDirection } from 'models';
import {
  DescriptionItem,
  getQueryParamsStr,
  NwsAlert,
  NwsAlerts,
  NwsForecast,
  NwsObservations,
  NwsPeriod,
  NwsPeriodForecast,
  ReqQuery,
  Wind
} from 'models/api';
import { MinimalQueriedCity } from 'models/cities';
import {
  AlertSeverity,
  AlertsResponse,
  ForecastGridDataResponse,
  NwsUnits,
  ObservationResponse,
  PointsResponse,
  QuantitativeMinMaxValue,
  QuantitativeValue,
  StationsResponse,
  SummaryForecastPeriod,
  SummaryForecastResponse
} from 'models/nws';
import { Cached, CacheEntry } from './cached';
import { FeelsHelper } from './feels-helper';
import { LoggerHelper } from './logger-helper';

dayjs.extend(advancedFormat);
dayjs.extend(localeData);
dayjs.extend(timezone);

type AlertsResponseWithTz = { alertsResp: AlertsResponse } & Pick<MinimalQueriedCity, 'timeZone'>;

const NWS_ALERTS_SYSTEM_CODE_REGEX = /^[A-Z]{3}$/;
const NWS_ALERTS_HEADING_REGEX = /(\w+( +\w+)*)(?=\.{3})/;
const NWS_ALERTS_BODY_REGEX = /(?<=\.{3})(.*)/m;

export class NwsHelper {
  private static readonly CLASS_NAME = 'NwsHelper';
  private static readonly BASE_URL = 'https://api.weather.gov/';
  private static readonly userAgent = process.env.USER_AGENT!;

  static getIsoTzString(time: Dayjs) {
    return time.format('YYYY-MM-DDTHH:mm:ssZ');
  }

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

  static mapForecastsToNwsForecast(
    summaryForecastCacheEntry: CacheEntry<SummaryForecastResponse | null>,
    forecastGridDataCacheEntry: CacheEntry<ForecastGridDataResponse | null>,
    timeZone: string,
    reqQuery: ReqQuery
  ): NwsForecast {
    const summaryForecast = summaryForecastCacheEntry.item?.properties;
    const forecastGridData = forecastGridDataCacheEntry.item?.properties;

    const isTimeBeforeEndOfDay = (time: Dayjs) => time.isBefore(dayjs().tz(timeZone).endOf('day'));

    const mapWindDirToDeg = (dir?: WindDirection | DetailedWindDirection | null) => {
      if (dir === WindDirection.N) return 0;
      else if (dir === DetailedWindDirection.NNE) return 22.5;
      else if (dir === WindDirection.NE) return 45;
      else if (dir === DetailedWindDirection.ENE) return 67.5;
      else if (dir === WindDirection.E) return 90;
      else if (dir === DetailedWindDirection.ESE) return 112.5;
      else if (dir === WindDirection.SE) return 135;
      else if (dir === DetailedWindDirection.SSE) return 157.5;
      else if (dir === WindDirection.S) return 180;
      else if (dir === DetailedWindDirection.SSW) return 202.5;
      else if (dir === WindDirection.SW) return 225;
      else if (dir === DetailedWindDirection.WSW) return 247.5;
      else if (dir === WindDirection.W) return 270;
      else if (dir === DetailedWindDirection.WNW) return 292.5;
      else if (dir === WindDirection.NW) return 315;
      else if (dir === DetailedWindDirection.NNW) return 337.5;

      return null;
    };

    const getWind = (period: SummaryForecastPeriod): Wind => {
      let wind: Wind = {
        speed: null,
        gustSpeed: null,
        directionDeg: mapWindDirToDeg(period.windDirection)
      };

      const speedAsValue = period.windSpeed as QuantitativeValue;
      const speedAsMinMax = period.windSpeed as QuantitativeMinMaxValue;
      if (speedAsValue?.value != null) {
        wind.speed = NumberHelper.convertNws(speedAsValue, UnitType.wind, reqQuery);
      } else if (speedAsMinMax?.maxValue != null) {
        wind.speed = NumberHelper.convertNwsRawValueAndUnitCode(
          speedAsMinMax.maxValue,
          speedAsMinMax.unitCode,
          UnitType.wind,
          reqQuery
        );
      }

      const gustSpeedAsValue = period.windGust as QuantitativeValue;
      const gustSpeedAsMinMax = period.windGust as QuantitativeMinMaxValue;
      if (gustSpeedAsValue?.value != null) {
        wind.gustSpeed = NumberHelper.convertNws(gustSpeedAsValue, UnitType.wind, reqQuery);
      } else if (gustSpeedAsMinMax?.maxValue != null) {
        wind.gustSpeed = NumberHelper.convertNwsRawValueAndUnitCode(
          gustSpeedAsMinMax.maxValue,
          gustSpeedAsMinMax.unitCode,
          UnitType.wind,
          reqQuery
        );
      }

      return wind;
    };

    const CHANCE_OF_PRECIP_SEARCH_TEXT = 'Chance of precipitation is';
    const getChanceOfPrecip = (period: SummaryForecastPeriod) => {
      if (period.detailedForecast) {
        const dfSplitOnSearchText = period.detailedForecast.split(
          new RegExp(` *${CHANCE_OF_PRECIP_SEARCH_TEXT} *`, 'i')
        );
        if (dfSplitOnSearchText.length === 2) {
          const chanceOfPrecipStr = dfSplitOnSearchText[1].split('%')[0];
          const chanceOfPrecipNum = Number(chanceOfPrecipStr);
          if (chanceOfPrecipStr.length > 0 && chanceOfPrecipNum != null && !isNaN(chanceOfPrecipNum)) {
            return chanceOfPrecipNum;
          }
        } else if (dfSplitOnSearchText.length < 2) {
          return 0;
        }
      }

      return null;
    };

    const getSummaryPeriodForecast = (period: SummaryForecastPeriod): NwsPeriodForecast => {
      const start = dayjs(period.startTime).tz(timeZone);
      return {
        start: start.unix(),
        startIsoTz: this.getIsoTzString(start),
        condition: period.shortForecast,
        temperature: NumberHelper.convertNws(period.temperature, UnitType.temp, reqQuery),
        feelsLike: null, // TODO
        dewPoint: null, // TODO
        humidity: null, // TODO
        wind: getWind(period),
        chanceOfPrecip: getChanceOfPrecip(period),
        precipAmount: null // TODO
      };
    };

    let periods: NwsPeriod[] = [];
    for (let i = 0; i < (summaryForecast?.periods ?? []).length; ) {
      let startTime = dayjs(summaryForecast!.periods[i].startTime).tz(timeZone);
      let dayName = dayjs.weekdays()[startTime.day()];
      if (isTimeBeforeEndOfDay(startTime)) {
        if (summaryForecast!.periods[i].isDaytime) {
          dayName = 'Today';
        } else if (isTimeBeforeEndOfDay(dayjs(summaryForecast!.periods[i].endTime).tz(timeZone))) {
          startTime = startTime.startOf('day').subtract(1, 'second'); // yesterday at 23:59:59
          dayName = 'Overnight';
        } else {
          dayName = 'Tonight';
        }
      }
      const shortDateName = startTime.format('MMM D');

      const dayForecast = summaryForecast!.periods[i].isDaytime
        ? getSummaryPeriodForecast(summaryForecast!.periods[i])
        : null;
      const nightForecast =
        i + 1 < summaryForecast!.periods.length ? getSummaryPeriodForecast(summaryForecast!.periods[i + 1]) : null;

      periods.push({
        dayName,
        shortDateName,
        dayForecast,
        nightForecast,
        hourlyForecasts: [] // TODO
      });

      i += summaryForecast!.periods[i].isDaytime ? 2 : 1;
    }

    const summaryForecastReadTime = summaryForecast?.updateTime ? dayjs(summaryForecast.updateTime).unix() : 0;
    const forecastGridDataReadTime = forecastGridData?.updateTime ? dayjs(forecastGridData.updateTime).unix() : 0;

    return {
      readTime: Math.max(summaryForecastReadTime, forecastGridDataReadTime),
      validUntil: Math.min(summaryForecastCacheEntry.validUntil, forecastGridDataCacheEntry.validUntil),
      periods
    };
  }

  static async getAlerts(minQueriedCity: MinimalQueriedCity): Promise<AlertsResponseWithTz> {
    const coordinatesStr = CoordinatesHelper.cityToStr(minQueriedCity);
    const alertsResp = (await (
      await this.fetch(`${this.BASE_URL}alerts/active${getQueryParamsStr({ point: coordinatesStr })}`)
    ).json()) as AlertsResponse;
    return {
      alertsResp,
      timeZone: minQueriedCity.timeZone
    };
  }

  static mapAlertsToNwsAlerts(response: AlertsResponseWithTz): NwsAlerts {
    const getDayjsFormatTemplate = (includeDay: boolean, time: Dayjs) =>
      `${includeDay ? 'ddd ' : ''}h${time.minute() > 0 ? ':mm' : ''}a`;

    const getFormatted = (includeDay: boolean, time: Dayjs) => ({
      label: time.format(getDayjsFormatTemplate(includeDay, time)),
      shortTz: time.format('z')
    });

    const mapToNumericSeverity = (severity: AlertSeverity) => {
      if (severity === AlertSeverity.EXTREME) return 4;
      else if (severity === AlertSeverity.SEVERE) return 3;
      else if (severity === AlertSeverity.MODERATE) return 2;
      else if (severity === AlertSeverity.MINOR) return 1;
      return 0;
    };

    const now = dayjs().tz(response.timeZone);
    const alerts = response.alertsResp.features
      .filter(
        alert =>
          (alert.properties.ends ? dayjs(alert.properties.ends).isAfter(now) : true) &&
          dayjs(alert.properties.expires).isAfter(now)
      )
      .map((alert): NwsAlert => {
        const rawDescription = alert.properties.description;

        // Split raw description on '\n\n' if present or '\n' if it has headings; otherwise, don't split
        let splitRawDescription = [rawDescription];
        if (rawDescription.includes('\n\n')) splitRawDescription = rawDescription.split('\n\n');
        else if (NWS_ALERTS_HEADING_REGEX.exec(rawDescription)) splitRawDescription = rawDescription.split('\n');

        const description = splitRawDescription
          .filter((descItemStr, idx) => !(idx === 0 && NWS_ALERTS_SYSTEM_CODE_REGEX.test(descItemStr)))
          .map((descItemStr): DescriptionItem => {
            const normDescItemStr = descItemStr.replaceAll('\n', ' ');
            const headingExecd = NWS_ALERTS_HEADING_REGEX.exec(normDescItemStr);
            const bodyExecd = NWS_ALERTS_BODY_REGEX.exec(normDescItemStr);

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

        const onsetDayjs = dayjs(alert.properties.onset ?? alert.properties.effective).tz(response.timeZone);
        const onsetIncludeDay = !onsetDayjs.isSame(now, 'day');
        const onsetFormatted = getFormatted(onsetIncludeDay, onsetDayjs);

        const endsDayjs = dayjs(alert.properties.ends ?? alert.properties.expires).tz(response.timeZone);
        const endsIncludeDay =
          !endsDayjs.isSame(now, 'day') && !(endsDayjs.isSame(onsetDayjs, 'day') && onsetDayjs.isAfter(now));
        const endsFormatted = getFormatted(endsIncludeDay, endsDayjs);

        return {
          onset: onsetDayjs.unix(),
          onsetIsoTz: this.getIsoTzString(onsetDayjs),
          onsetLabel: onsetFormatted.label,
          onsetShortTz: onsetFormatted.shortTz,
          ends: endsDayjs.unix(),
          endsIsoTz: this.getIsoTzString(endsDayjs),
          endsLabel: endsFormatted.label,
          endsShortTz: endsFormatted.shortTz,
          severity: alert.properties.severity,
          senderName: alert.properties.senderName,
          title: alert.properties.event,
          description,
          instruction
        };
      })
      .sort((alert1, alert2) => mapToNumericSeverity(alert2.severity) - mapToNumericSeverity(alert1.severity));

    return {
      readTime: dayjs(response.alertsResp.updated).unix(),
      alerts
    };
  }
}
