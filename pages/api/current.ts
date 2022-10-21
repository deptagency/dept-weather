import { NextApiRequest, NextApiResponse } from 'next';
import { AQ_COORDINATES_STR } from '../../constants';
import { AirNowHelper, CoordinatesHelper, EpaHelper, NwsHelper, WeatherlinkHelper } from '../../helpers';
import { DataSource } from '../../models';
import { APIRoute, BaseObservations, getPath, Observations, Response } from '../../models/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const coordinatesStr = CoordinatesHelper.adjustPrecision(AQ_COORDINATES_STR);
    const promises = await Promise.all([
      WeatherlinkHelper.getCurrent(coordinatesStr),
      NwsHelper.getCurrent(coordinatesStr),
      AirNowHelper.getCurrent(coordinatesStr),
      EpaHelper.getHourly(coordinatesStr)
    ]);
    const validUntil = Math.min(...promises.map(promise => promise.validUntil));
    const maxAge = Math.min(...promises.map(promise => promise.maxAge));
    const data: Observations = {
      [DataSource.WEATHERLINK]: WeatherlinkHelper.mapCurrentToWlObservations(promises[0], req.query),
      [DataSource.NATIONAL_WEATHER_SERVICE]: NwsHelper.mapCurrentToNwsObservations(promises[1], req.query),
      [DataSource.AIRNOW]: AirNowHelper.mapCurrentToAirNowObservations(promises[2]),
      [DataSource.ENVIRONMENTAL_PROTECTION_AGENCY]: EpaHelper.mapHourlyToEpaHourlyForecast(promises[3])
    };
    const latestReadTime = Math.max(
      ...Object.values(data).map((observation: BaseObservations) => observation.readTime)
    );

    const response: Response<Observations> = {
      data,
      warnings: [],
      errors: [],
      validUntil,
      latestReadTime
    };

    res.setHeader('Cache-Control', `public, immutable, stale-while-revalidate, max-age=${maxAge}`);
    res.status(200).json(response);
  } catch (err) {
    console.log(`[${getPath(APIRoute.CURRENT)}]`, err);
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
