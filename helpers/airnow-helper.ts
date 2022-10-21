import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import fetch from 'node-fetch';
import { AIRNOW_RECORDING_INTERVAL, AIRNOW_UPLOAD_DELAY } from '../constants';
import { Coordinates } from '../models';
import { CurrentObservations } from '../models/airnow';
import { AirNowObservations } from '../models/api';
import { Cached, CacheEntry } from './cached';

dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

export class AirNowHelper {
  private static readonly apiKey = process.env.AIRNOW_API_KEY!;

  private static getRequestUrlFor(coordinates: Coordinates) {
    return `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&distance=100&API_KEY=${this.apiKey}`;
  }

  private static getLatestReadTime(observations: CurrentObservations) {
    const readTimes = observations.map(observation => {
      const stringToParse = `${observation?.DateObserved?.trim()} ${observation?.HourObserved}`;
      try {
        return dayjs(stringToParse, 'YYYY-M-D H', observation.LocalTimeZone).unix();
      } catch (err) {
        console.log(`[AirNowHelper.getLatestReadTime()]`, `Couldn't parse "${stringToParse}"`, err);
        return 0;
      }
    });
    return Math.max(0, ...readTimes);
  }

  private static readonly current = new Cached<CurrentObservations, Coordinates>(
    async (coordinates: Coordinates) =>
      (await fetch(this.getRequestUrlFor(coordinates))).json() as Promise<CurrentObservations>,
    async (newItem: CurrentObservations) => {
      const latestReadTime = this.getLatestReadTime(newItem);
      return latestReadTime ? latestReadTime + AIRNOW_RECORDING_INTERVAL + AIRNOW_UPLOAD_DELAY : 0;
    },
    true,
    '[AirNowHelper.current]'
  );
  static async getCurrent(coordinates: Coordinates) {
    return this.current.get(`${coordinates.latitude},${coordinates.longitude}`, coordinates);
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
