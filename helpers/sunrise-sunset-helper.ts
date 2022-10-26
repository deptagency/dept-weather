import dayjs from 'dayjs';
import { find } from 'geo-tz';
import { getSunrise, getSunset } from 'sunrise-sunset-js';
import { SunriseSunsetObservations } from '../models/api';
import { SunriseSunset } from '../models/sunrise-sunset';
import { Cached, CacheEntry } from './cached';
import { CoordinatesHelper } from './coordinates-helper';
import { NumberHelper } from './number-helper';

export class SunriseSunsetHelper {
  static getSunrise(coordinatesStr: string) {
    try {
      const coordinatesNumArr = CoordinatesHelper.strToNumArr(coordinatesStr);
      return NumberHelper.round(getSunrise(coordinatesNumArr[0], coordinatesNumArr[1]).getTime() / 1_000, 0);
    } catch (err) {
      console.log(`[SunriseSunsetHelper.getSunrise()]`, `Couldn't get sunrise for "${coordinatesStr}"`, err);
    }
  }

  static getSunset(coordinatesStr: string) {
    try {
      const coordinatesNumArr = CoordinatesHelper.strToNumArr(coordinatesStr);
      return NumberHelper.round(getSunset(coordinatesNumArr[0], coordinatesNumArr[1]).getTime() / 1_000, 0);
    } catch (err) {
      console.log(`[SunriseSunsetHelper.getSunset()]`, `Couldn't get sunset for "${coordinatesStr}"`, err);
    }
  }

  static getTimeZone(coordinatesStr: string) {
    try {
      const coordinatesNumArr = CoordinatesHelper.strToNumArr(coordinatesStr);
      const timeZones = find(coordinatesNumArr[0], coordinatesNumArr[1]);
      return timeZones?.length > 0 ? timeZones[0] : undefined;
    } catch (err) {
      console.log(`[SunriseSunsetHelper.getTimeZone()]`, `Couldn't find timezone for "${coordinatesStr}"`, err);
    }
  }

  private static readonly sunrisesunset = new Cached<SunriseSunset, string>(
    async (coordinatesStr: string) => ({
      timezone: this.getTimeZone(coordinatesStr) ?? null,
      sunrise: this.getSunrise(coordinatesStr) ?? null,
      sunset: this.getSunset(coordinatesStr) ?? null
    }),
    async (_: string, __: SunriseSunset) => dayjs().endOf('day').unix(),
    true,
    '[SunriseSunsetHelper.sunrisesunset]'
  );
  static async getSunriseSunset(coordinatesStr: string) {
    return this.sunrisesunset.get(coordinatesStr, coordinatesStr);
  }

  static mapSunriseSunsetToSunriseSunsetObservations(cacheEntry: CacheEntry<SunriseSunset>): SunriseSunsetObservations {
    return {
      ...cacheEntry.item,
      readTime: dayjs().startOf('day').unix(),
      validUntil: cacheEntry.validUntil
    };
  }
}
