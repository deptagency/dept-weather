import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import geo2zip from 'geo2zip';
import fetch from 'node-fetch';
import { EpaHourlyForecast, EpaHourlyForecastItem } from '../../models/api';
import { QueriedLocation } from '../../models/cities';
import { UVHourlyForecast, UVHourlyForecastItem } from '../../models/epa';
import { Cached, CacheEntry } from './cached';
import { CoordinatesHelper } from '../';

dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

type UVHourlyForecastWithTz = { uvHourlyForecast: UVHourlyForecast } & Pick<QueriedLocation, 'timeZone'>;

export class EpaHelper {
  private static readonly userAgent = process.env.USER_AGENT!;

  private static getRequestUrlFor(zipCode: string) {
    return `https://data.epa.gov/efservice/getEnvirofactsUVHOURLY/ZIP/${zipCode}/JSON`;
  }

  private static getParsedUnixTime(hourlyForecastItem: UVHourlyForecastItem, timeZone?: string) {
    const stringToParse = hourlyForecastItem.DATE_TIME;
    try {
      const dateTimeFormat = 'MMM/DD/YYYY hh A';
      return (
        timeZone ? dayjs.tz(stringToParse, dateTimeFormat, timeZone) : dayjs(stringToParse, dateTimeFormat)
      ).unix();
    } catch (err) {
      console.log(`[EpaHelper.getParsedUnixTime()]`, `Couldn't parse "${stringToParse}"`, err);
    }
    return 0;
  }

  private static readonly hourly = new Cached<UVHourlyForecastWithTz, QueriedLocation>(
    async (queriedLocation: QueriedLocation) => {
      const coordinatesNumArr = CoordinatesHelper.cityToNumArr(queriedLocation);
      const closestZipArr = await geo2zip(coordinatesNumArr);
      const closestZip = closestZipArr?.length > 0 ? closestZipArr[0] : '';

      const uvHourlyForecast = (await (
        await fetch(this.getRequestUrlFor(closestZip), { headers: { 'User-Agent': this.userAgent } })
      ).json()) as UVHourlyForecast;
      return {
        uvHourlyForecast,
        timeZone: queriedLocation.timeZone
      };
    },
    async (_: string, newItem: UVHourlyForecastWithTz) => {
      return newItem.uvHourlyForecast?.length > 0
        ? this.getParsedUnixTime(newItem.uvHourlyForecast[newItem.uvHourlyForecast.length - 1], newItem.timeZone)
        : 0;
    },
    true,
    '[EpaHelper.hourly]'
  );
  static async getHourly(queriedLocation: QueriedLocation) {
    return this.hourly.get(CoordinatesHelper.cityToStr(queriedLocation), queriedLocation);
  }

  static mapHourlyToEpaHourlyForecast(cacheEntry: CacheEntry<UVHourlyForecastWithTz>): EpaHourlyForecast {
    const hourlyForecastIn = cacheEntry.item.uvHourlyForecast ?? [];
    const hourlyForecast = (hourlyForecastIn instanceof Array ? hourlyForecastIn : []).map(
      (forecastItem: UVHourlyForecastItem): EpaHourlyForecastItem => ({
        time: this.getParsedUnixTime(forecastItem, cacheEntry.item.timeZone),
        uvIndex: forecastItem.UV_VALUE
      })
    );

    const hoursWithNonZeroUvIndex = hourlyForecast.filter(forecastItem => forecastItem.uvIndex);
    const readTime = (
      hoursWithNonZeroUvIndex.length > 0
        ? dayjs
            .unix(hoursWithNonZeroUvIndex[hoursWithNonZeroUvIndex.length - 1].time)
            .subtract(1, 'day')
            .add(1, 'hour')
        : dayjs().tz(cacheEntry.item.timeZone).startOf('day')
    ).unix();

    return {
      hourlyForecast,
      readTime,
      validUntil: cacheEntry.validUntil
    };
  }
}
