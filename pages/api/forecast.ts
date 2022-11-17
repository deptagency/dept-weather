import { NextApiRequest, NextApiResponse } from 'next';
import { CitiesHelper, LoggerHelper, NwsHelper } from 'helpers/api';
import { DataSource } from 'models';
import { APIRoute, Forecast, getPath, Response } from 'models/api';

const LOGGER_LABEL = getPath(APIRoute.CURRENT);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { queriedLocation, warnings } = await CitiesHelper.parseQueriedLocation(req.query);
    const forecast = await NwsHelper.getForecast(queriedLocation);

    const data: Forecast = {
      [DataSource.NATIONAL_WEATHER_SERVICE]: NwsHelper.mapForecastToNwsForecast(forecast, req.query),
      [DataSource.QUERIED_LOCATION]: queriedLocation
    };

    const response: Response<Forecast> = {
      data,
      warnings,
      errors: [],
      validUntil: forecast.validUntil,
      latestReadTime: data.nws!.readTime
    };

    if (process.env.NODE_ENV !== 'development') {
      res.setHeader('Cache-Control', `public, immutable, stale-while-revalidate, max-age=${forecast.maxAge}`);
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
