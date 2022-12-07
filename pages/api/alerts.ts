import { NextApiRequest, NextApiResponse } from 'next';
import { CitiesReqQueryHelper, LoggerHelper, NwsHelper } from 'helpers/api';
import { DataSource } from 'models';
import { Alerts, APIRoute, getPath, Response } from 'models/api';
import { ALERTS_MAX_AGE } from '@constants';

const LOGGER_LABEL = getPath(APIRoute.ALERTS);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { queriedCity, minimalQueriedCity, warnings } = await CitiesReqQueryHelper.parseQueriedCity(req.query);
    const alerts = await NwsHelper.getAlerts(minimalQueriedCity);

    const data: Alerts = {
      [DataSource.NATIONAL_WEATHER_SERVICE]: NwsHelper.mapAlertsToNwsAlerts(alerts),
      [DataSource.QUERIED_CITY]: queriedCity
    };

    const response: Response<Alerts> = {
      data,
      warnings,
      errors: [],
      validUntil: 0,
      latestReadTime: data.nws!.readTime
    };

    if (process.env.NODE_ENV !== 'development') {
      res.setHeader('Cache-Control', `public, stale-while-revalidate, max-age=${ALERTS_MAX_AGE}`);
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
