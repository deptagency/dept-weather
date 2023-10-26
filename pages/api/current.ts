import dayjs from 'dayjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { AirNowHelper } from 'helpers/api/airnow-helper';
import { CacheEntry } from 'helpers/api/cached';
import { CitiesReqQueryHelper } from 'helpers/api/cities-req-query-helper';
import { EpaHelper } from 'helpers/api/epa-helper';
import { LoggerHelper } from 'helpers/api/logger-helper';
import { NwsHelper } from 'helpers/api/nws/nws-helper';
import { NwsMapHelper } from 'helpers/api/nws/nws-map-helper';
import { SunTimesHelper } from 'helpers/api/sun-times-helper';
import { WeatherlinkHelper } from 'helpers/api/weatherlink-helper';
import { DataSource } from 'models';
import { APIRoute, BaseData, getPath, Observations, Response } from 'models/api';

const LOGGER_LABEL = getPath(APIRoute.CURRENT);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const getFormattedDuration = LoggerHelper.trackPerformance();
    const { queriedCity, minimalQueriedCity, warnings } = await CitiesReqQueryHelper.parseQueriedCity(
      req.query,
      getFormattedDuration
    );
    const promises: Array<Promise<CacheEntry<any>>> = [
      NwsHelper.getCurrent(minimalQueriedCity),
      AirNowHelper.getCurrent(minimalQueriedCity),
      EpaHelper.getHourly(minimalQueriedCity),
      SunTimesHelper.getTimes(minimalQueriedCity)
    ];
    if (WeatherlinkHelper.shouldUse(minimalQueriedCity)) {
      promises.push(WeatherlinkHelper.getCurrent());
    }

    const results = await Promise.all(promises);
    const validUntil = Math.min(...results.map(result => result.validUntil));
    const maxAge = validUntil ? validUntil - dayjs().unix() : 0;

    const data: Observations = {
      ...(results.length > 4
        ? { [DataSource.WEATHERLINK]: WeatherlinkHelper.mapCurrentToWlObservations(results[4], req.query) }
        : {}),
      [DataSource.NATIONAL_WEATHER_SERVICE]: NwsMapHelper.mapCurrentToNwsObservations(results[0], req.query),
      [DataSource.AIRNOW]: AirNowHelper.mapCurrentToAirNowObservations(results[1]),
      [DataSource.ENVIRONMENTAL_PROTECTION_AGENCY]: EpaHelper.mapHourlyToEpaHourlyForecast(results[2]),
      [DataSource.SUN_TIMES]: SunTimesHelper.mapTimesToSunTimesObservations(results[3]),
      [DataSource.QUERIED_CITY]: queriedCity
    };
    const latestReadTime = Math.max(
      ...Object.values(data)
        .map((observation: BaseData) => observation.readTime)
        .filter(readTime => Number.isInteger(readTime))
    );

    const response: Response<Observations> = {
      data,
      warnings,
      errors: [],
      validUntil,
      latestReadTime
    };
    if (process.env.NODE_ENV !== 'development') {
      res.setHeader('Cache-Control', `public, immutable, stale-while-revalidate, max-age=${maxAge}`);
    }
    res.status(response.latestReadTime ? 200 : 502).json(response);
  } catch (err) {
    LoggerHelper.getLogger(LOGGER_LABEL).error(err);
    const errorResponse: Response<null> = {
      data: null,
      warnings: [],
      errors: ['Failed to fetch data'],
      validUntil: 0,
      latestReadTime: 0
    };
    res.status(500).json(errorResponse);
  }
}
