import { NextApiRequest, NextApiResponse } from 'next';
import dayjs from 'dayjs';
import { CitiesReqQueryHelper } from 'helpers/api/cities-req-query-helper';
import { LoggerHelper } from 'helpers/api/logger-helper';
import { NwsHelper } from 'helpers/api/nws/nws-helper';
import { NwsMapHelper } from 'helpers/api/nws/nws-map-helper';
import { CoordinatesHelper } from 'helpers/coordinates-helper';
import { APIRoute, getPath } from 'models/api/api-route.model';
import { Forecast } from 'models/api/forecast.model';
import { Response } from 'models/api/response.model';
import { DataSource } from 'models/data-source.enum';

const LOGGER_LABEL = getPath(APIRoute.FORECAST);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const getFormattedDuration = LoggerHelper.trackPerformance();
    const { queriedCity, minimalQueriedCity, warnings } = await CitiesReqQueryHelper.parseQueriedCity(
      req.query,
      getFormattedDuration
    );

    const points = await NwsHelper.getPoints(CoordinatesHelper.cityToStr(minimalQueriedCity));
    const timeZone = points.item.properties.timeZone;
    const forecasts = await Promise.all([NwsHelper.getSummaryForecast(points), NwsHelper.getForecastGridData(points)]);

    const data: Forecast = {
      [DataSource.NATIONAL_WEATHER_SERVICE]: NwsMapHelper.mapForecastsToNwsForecast(...forecasts, timeZone, req.query),
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
      res.setHeader('Cache-Control', `public, stale-while-revalidate, max-age=${maxAge}`);
    }
    res.status(response.latestReadTime ? 200 : 502).json(response);
  } catch (err) {
    LoggerHelper.getLogger(LOGGER_LABEL).error('Failed');
    console.error(err);
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
