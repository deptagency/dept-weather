import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import geo2zip from 'geo2zip';
import fetch from 'node-fetch';
import { EpaHourlyForecast, EpaHourlyForecastItem } from '../models/api';
import { UVHourlyForecast, UVHourlyForecastItem } from '../models/epa';
import { Cached, CacheEntry } from './cached';
import { CoordinatesHelper } from './coordinates-helper';
import { SunriseSunsetHelper } from './sunrise-sunset-helper';

dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

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

  private static readonly hourly = new Cached<UVHourlyForecast, string>(
    async (coordinatesStr: string) => {
      const coordinatesNumArr = CoordinatesHelper.strToNumArr(coordinatesStr);
      const closestZipArr = await geo2zip(coordinatesNumArr);
      const closestZip = closestZipArr?.length > 0 ? closestZipArr[0] : '';

      return (
        await fetch(this.getRequestUrlFor(closestZip), { headers: { 'User-Agent': this.userAgent } })
      ).json() as Promise<UVHourlyForecast>;
    },
    async (key: string, newItem: UVHourlyForecast) => {
      return newItem?.length > 0
        ? this.getParsedUnixTime(newItem[newItem.length - 1], SunriseSunsetHelper.getTimeZone(key))
        : 0;
    },
    true,
    '[EpaHelper.hourly]'
  );
  static async getHourly(coordinatesStr: string) {
    return this.hourly.get(coordinatesStr, coordinatesStr);
  }

  static mapHourlyToEpaHourlyForecast(cacheEntry: CacheEntry<UVHourlyForecast>): EpaHourlyForecast {
    const timeZone = SunriseSunsetHelper.getTimeZone(cacheEntry.key);

    const hourlyForecast =
      cacheEntry.item?.map(
        (forecastItem: UVHourlyForecastItem): EpaHourlyForecastItem => ({
          time: this.getParsedUnixTime(forecastItem, timeZone),
          uvIndex: forecastItem.UV_VALUE
        })
      ) ?? [];

    const hoursWithNonZeroUvIndex = hourlyForecast.filter(forecastItem => forecastItem.uvIndex);
    const readTime = (
      hoursWithNonZeroUvIndex.length > 0
        ? dayjs
            .unix(hoursWithNonZeroUvIndex[hoursWithNonZeroUvIndex.length - 1].time)
            .subtract(1, 'day')
            .add(1, 'hour')
        : dayjs().startOf('day')
    ).unix();

    return {
      hourlyForecast,
      readTime,
      validUntil: cacheEntry.validUntil
    };
  }
}
