import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import fetch from 'node-fetch';
import { AIRNOW_RECORDING_INTERVAL, AIRNOW_UPLOAD_DELAY } from '../../constants';
import { CurrentObservations } from '../../models/airnow';
import { AirNowObservations } from '../../models/api';
import { QueriedLocation } from '../../models/cities';
import { Cached, CacheEntry } from './cached';
import { CoordinatesHelper } from '../';

dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

type CurrentObservationsWithTz = { observations: CurrentObservations } & Pick<QueriedLocation, 'timeZone'>;

export class AirNowHelper {
  private static readonly apiKey = process.env.AIRNOW_API_KEY!;
  private static readonly userAgent = process.env.USER_AGENT!;

  private static getRequestUrlFor(queriedLocation: QueriedLocation) {
    const coordinatesArr = CoordinatesHelper.cityToNumArr(queriedLocation);
    return `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${coordinatesArr[0]}&longitude=${coordinatesArr[1]}&distance=100&API_KEY=${this.apiKey}`;
  }

  private static getLatestReadTime(observationsWithTz: CurrentObservationsWithTz) {
    const readTimes = observationsWithTz.observations.map(observation => {
      const stringToParse = `${observation?.DateObserved?.trim()} ${observation?.HourObserved}`;
      try {
        return dayjs.tz(stringToParse, 'YYYY-M-D H', observationsWithTz.timeZone).unix();
      } catch (err) {
        console.log(`[AirNowHelper.getLatestReadTime()]`, `Couldn't parse "${stringToParse}"`, err);
        return 0;
      }
    });
    return Math.max(0, ...readTimes);
  }

  private static readonly current = new Cached<CurrentObservationsWithTz, QueriedLocation>(
    async (queriedLocation: QueriedLocation) => {
      const currentObservations = (await (
        await fetch(this.getRequestUrlFor(queriedLocation), { headers: { 'User-Agent': this.userAgent } })
      ).json()) as CurrentObservations;
      return {
        observations: currentObservations,
        timeZone: queriedLocation.timeZone
      };
    },
    async (_: string, newItem: CurrentObservationsWithTz) => {
      const latestReadTime = this.getLatestReadTime(newItem);
      return latestReadTime ? latestReadTime + AIRNOW_RECORDING_INTERVAL + AIRNOW_UPLOAD_DELAY : 0;
    },
    true,
    '[AirNowHelper.current]'
  );
  static async getCurrent(queriedLocation: QueriedLocation) {
    return this.current.get(CoordinatesHelper.cityToStr(queriedLocation), queriedLocation);
  }

  static mapCurrentToAirNowObservations(cacheEntry: CacheEntry<CurrentObservationsWithTz>): AirNowObservations {
    return {
      readTime: this.getLatestReadTime(cacheEntry.item),
      validUntil: cacheEntry.validUntil,
      observations: cacheEntry.item.observations.map(observation => ({
        pollutant: observation.ParameterName,
        aqi: observation.AQI,
        aqiLevelName: observation.Category.Name
      }))
    };
  }
}
