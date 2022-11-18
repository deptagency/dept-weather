import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { getSunrise, getSunset } from 'sunrise-sunset-js';
import { CoordinatesHelper } from 'helpers';
import { SunTimesObservations } from 'models/api';
import { MinimalQueriedCity } from 'models/cities';
import { SunriseSunset } from 'models/sunrise-sunset';
import { Cached, CacheEntry } from './cached';
import { LoggerHelper } from './logger-helper';

dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

type SunriseSunsetWithTz = { sunriseSunset: SunriseSunset } & Pick<MinimalQueriedCity, 'timeZone'>;

export class SunTimesHelper {
  private static readonly CLASS_NAME = 'SunTimesHelper';

  static getSun(riseOrSet: 'rise' | 'set', minQueriedCity: MinimalQueriedCity, day: Dayjs) {
    try {
      const coordinatesNumArr = CoordinatesHelper.cityToNumArr(minQueriedCity);
      const sunFn = riseOrSet === 'rise' ? getSunrise : getSunset;
      return dayjs(sunFn(coordinatesNumArr[0], coordinatesNumArr[1], day.toDate()));
    } catch (err) {
      LoggerHelper.getLogger(`${this.CLASS_NAME}.getSun()`).error(
        `Couldn't get sun${riseOrSet} for "${CoordinatesHelper.cityToStr(minQueriedCity)}"`
      );
    }
  }

  private static readonly times = new Cached<SunriseSunsetWithTz, MinimalQueriedCity>(
    async (minQueriedCity: MinimalQueriedCity) => {
      const currentLocalTime = dayjs().tz(minQueriedCity.timeZone);

      let sunrise = this.getSun('rise', minQueriedCity, currentLocalTime);
      if (sunrise != null) {
        if (sunrise.isBefore(currentLocalTime.startOf('day'))) {
          sunrise = this.getSun('rise', minQueriedCity, currentLocalTime.add(1, 'day'));
        } else if (sunrise.isAfter(currentLocalTime.endOf('day'))) {
          sunrise = this.getSun('rise', minQueriedCity, currentLocalTime.subtract(1, 'day'));
        }
      }

      let sunset = this.getSun('set', minQueriedCity, currentLocalTime);
      if (sunrise != null && sunset != null) {
        if (sunset.isBefore(sunrise)) {
          sunset = this.getSun('set', minQueriedCity, currentLocalTime.add(1, 'day'));
        } else if (sunset.isAfter(currentLocalTime.endOf('day'))) {
          sunset = this.getSun('rise', minQueriedCity, currentLocalTime.subtract(1, 'day'));
        }
      }

      return {
        timeZone: minQueriedCity.timeZone,
        sunriseSunset: {
          sunrise: sunrise?.unix() ?? null,
          sunset: sunset?.unix() ?? null
        }
      };
    },
    async (_: string, newItem: SunriseSunsetWithTz) => dayjs().tz(newItem.timeZone).endOf('day').unix(),
    LoggerHelper.getLogger(`${this.CLASS_NAME}.times`)
  );
  static async getTimes(minQueriedCity: MinimalQueriedCity) {
    return this.times.get(CoordinatesHelper.cityToStr(minQueriedCity), minQueriedCity);
  }

  static mapTimesToSunTimesObservations(cacheEntry: CacheEntry<SunriseSunsetWithTz>): SunTimesObservations {
    return {
      ...cacheEntry.item.sunriseSunset,
      readTime: dayjs().tz(cacheEntry.item.timeZone).startOf('day').unix(),
      validUntil: cacheEntry.validUntil
    };
  }
}
