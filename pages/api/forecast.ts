import dayjs from 'dayjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { CitiesReqQueryHelper, LoggerHelper, NwsHelper } from 'helpers/api';
import { DataSource } from 'models';
import { APIRoute, Forecast, getPath, Response } from 'models/api';
import { CoordinatesHelper } from 'helpers';

const LOGGER_LABEL = getPath(APIRoute.FORECAST);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { queriedCity, minimalQueriedCity, warnings } = await CitiesReqQueryHelper.parseQueriedCity(req.query);
    const points = await NwsHelper.getPoints(CoordinatesHelper.cityToStr(minimalQueriedCity));
    const timeZone = points.item.properties.timeZone;
    const forecast = await NwsHelper.getForecast(points);

    const data: Forecast = {
      [DataSource.NATIONAL_WEATHER_SERVICE]: NwsHelper.mapForecastToNwsForecast(forecast, timeZone, req.query),
      [DataSource.QUERIED_CITY]: queriedCity
    };

    const response: Response<Forecast> = {
      data,
      warnings,
      errors: [],
      validUntil: forecast.validUntil,
      latestReadTime: data.nws!.readTime
    };
    const maxAge = forecast.validUntil ? forecast.validUntil - dayjs().unix() : 0;

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
