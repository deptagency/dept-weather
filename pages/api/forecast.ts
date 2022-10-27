import { NextApiRequest, NextApiResponse } from 'next';
import { AQ_COORDINATES_STR } from '../../constants';
import { CoordinatesHelper, NwsHelper } from '../../helpers';
import { DataSource } from '../../models';
import { APIRoute, Forecast, getPath, Response } from '../../models/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const coordinatesStr = CoordinatesHelper.adjustPrecision(AQ_COORDINATES_STR);
    const forecast = await NwsHelper.getForecast(coordinatesStr);

    const data: Forecast = {
      [DataSource.NATIONAL_WEATHER_SERVICE]: NwsHelper.mapForecastToNwsForecast(forecast, req.query)
    };

    const response: Response<Forecast> = {
      data,
      warnings: [],
      errors: [],
      validUntil: forecast.validUntil,
      latestReadTime: data.nws!.readTime
    };

    res.setHeader('Cache-Control', `public, immutable, stale-while-revalidate, max-age=${forecast.maxAge}`);
    res.status(200).json(response);
  } catch (err) {
    console.log(`[${getPath(APIRoute.FORECAST)}]`, err);
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
