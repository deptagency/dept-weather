import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import fetch from 'node-fetch';
import { AIRNOW_RECORDING_INTERVAL, AIRNOW_UPLOAD_DELAY } from '../../constants';
import { CurrentObservations } from '../../models/airnow';
import { AirNowObservations } from '../../models/api';
import { Cached, CacheEntry } from './cached';
import { CoordinatesHelper } from '../';

dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

export class AirNowHelper {
  private static readonly apiKey = process.env.AIRNOW_API_KEY!;
  private static readonly userAgent = process.env.USER_AGENT!;

  private static getRequestUrlFor(coordinatesStr: string) {
    const coordinatesArr = CoordinatesHelper.strToArr(coordinatesStr);
    return `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${coordinatesArr[0]}&longitude=${coordinatesArr[1]}&distance=100&API_KEY=${this.apiKey}`;
  }

  private static getLatestReadTime(observations: CurrentObservations) {
    const readTimes = observations.map(observation => {
      const stringToParse = `${observation?.DateObserved?.trim()} ${observation?.HourObserved}`;
      try {
        return dayjs.tz(stringToParse, 'YYYY-M-D H', observation.LocalTimeZone).unix();
      } catch (err) {
        console.log(`[AirNowHelper.getLatestReadTime()]`, `Couldn't parse "${stringToParse}"`, err);
        return 0;
      }
    });
    return Math.max(0, ...readTimes);
  }

  private static readonly current = new Cached<CurrentObservations, string>(
    async (coordinatesStr: string) =>
      (
        await fetch(this.getRequestUrlFor(coordinatesStr), { headers: { 'User-Agent': this.userAgent } })
      ).json() as Promise<CurrentObservations>,
    async (_: string, newItem: CurrentObservations) => {
      const latestReadTime = this.getLatestReadTime(newItem);
      return latestReadTime ? latestReadTime + AIRNOW_RECORDING_INTERVAL + AIRNOW_UPLOAD_DELAY : 0;
    },
    true,
    '[AirNowHelper.current]'
  );
  static async getCurrent(coordinatesStr: string) {
    return this.current.get(coordinatesStr, coordinatesStr);
  }

  static mapCurrentToAirNowObservations(cacheEntry: CacheEntry<CurrentObservations>): AirNowObservations {
    return {
      readTime: this.getLatestReadTime(cacheEntry.item),
      validUntil: cacheEntry.validUntil,
      observations: cacheEntry.item.map(observation => ({
        pollutant: observation.ParameterName,
        aqi: observation.AQI,
        aqiLevelName: observation.Category.Name
      }))
    };
  }
}
