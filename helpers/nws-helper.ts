import dayjs from 'dayjs';
import fetch, { HeadersInit } from 'node-fetch';
import { NWS_RECORDING_INTERVAL, NWS_UPLOAD_DELAY } from '../constants';
import { Unit, UnitMapping, UnitType } from '../models';
import { NwsForecast, NwsForecastPeriod, NwsObservations, ReqQuery, WindForecast } from '../models/api';
import {
  ForecastPeriod,
  ForecastResponse,
  NwsUnits,
  ObservationResponse,
  PointsResponse,
  QuantitativeMinMaxValue,
  QuantitativeValue,
  StationsResponse
} from '../models/nws';
import { Cached, CacheEntry } from './cached';
import { NumberHelper } from './number-helper';

export class NwsHelper {
  private static readonly BASE_URL = 'https://api.weather.gov/';
  private static readonly userAgent = process.env.USER_AGENT!;

  private static async fetch(url: string, headers?: HeadersInit) {
    return fetch(url, { headers: { ...(headers ?? {}), 'User-Agent': this.userAgent } });
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
      const lastReadingTimestamp = newItem.properties?.timestamp;
      return lastReadingTimestamp != null
        ? dayjs(lastReadingTimestamp).unix() + NWS_RECORDING_INTERVAL + NWS_UPLOAD_DELAY
        : 0;
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
      readTime: dayjs(nwsCurrent.timestamp).unix(),
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

  private static readonly forecast = new Cached<ForecastResponse, string>(
    async (forecastUrl: string) =>
      (
        await this.fetch(forecastUrl, { 'Feature-Flags': 'forecast_temperature_qv,forecast_wind_speed_qv' })
      ).json() as Promise<ForecastResponse>,
    async (_: string, newItem: any) => {
      const lastReading = dayjs(newItem.properties.updateTime);
      const oneHourFromLastReading = lastReading.add(1, 'hour').unix();
      const fifteenMinsFromNow = dayjs().add(15, 'minutes').unix();
      return Math.max(oneHourFromLastReading, fifteenMinsFromNow);
    },
    true,
    '[NwsHelper.forecast]'
  );
  static async getForecast(coordinatesStr: string) {
    const points = await this.getPoints(coordinatesStr);
    const forecastUrl = points.item.properties.forecast;
    return this.forecast.get(forecastUrl, forecastUrl);
  }

  static mapForecastToNwsForecast(cacheEntry: CacheEntry<ForecastResponse>, reqQuery: ReqQuery): NwsForecast {
    const forecast = cacheEntry.item.properties;

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

    const forecasts = forecast.periods.map((period): NwsForecastPeriod => {
      const start = dayjs(period.startTime);
      return {
        dayName: start.isBefore(dayjs().endOf('day')) ? 'Today' : period.name?.split(' ')[0],
        shortDateName: start.format('MMM D'),
        periodStart: start.unix(),
        periodEnd: dayjs(period.endTime).unix(),
        isDaytime: period.isDaytime,
        temperature: NumberHelper.convertNws(period.temperature, UnitType.temp, reqQuery),
        wind: getWind(period),
        shortForecast: period.shortForecast,
        detailedForecast: period.detailedForecast
      };
    });

    return {
      readTime: dayjs(forecast.updateTime).unix(),
      validUntil: cacheEntry.validUntil,
      forecasts
    };
  }
}
