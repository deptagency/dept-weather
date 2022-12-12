import dayjs from 'dayjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { CitiesReqQueryHelper, LoggerHelper, NwsHelper } from 'helpers/api';
import { DataSource } from 'models';
import { APIRoute, Forecast, getPath, Response } from 'models/api';

const LOGGER_LABEL = getPath(APIRoute.CURRENT);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { queriedCity, minimalQueriedCity, warnings } = await CitiesReqQueryHelper.parseQueriedCity(req.query);
    const forecast = await NwsHelper.getForecast(minimalQueriedCity);

    const data: Forecast = {
      [DataSource.NATIONAL_WEATHER_SERVICE]: NwsHelper.mapForecastToNwsForecast(forecast, req.query),
      [DataSource.QUERIED_CITY]: queriedCity
    };

    const response: Response<Forecast> = {
      data,
      warnings,
      errors: [],
      validUntil: data.nws!.validUntil,
      latestReadTime: data.nws!.readTime
    };
    const maxAge = data.nws!.validUntil ? data.nws!.validUntil - dayjs().unix() : 0;

    if (process.env.NODE_ENV !== 'development') {
      res.setHeader('Cache-Control', `public, immutable, stale-while-revalidate, max-age=${maxAge}`);
    }
    res.status(200).json(response);
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
