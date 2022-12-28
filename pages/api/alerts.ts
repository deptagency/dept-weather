import { NextApiRequest, NextApiResponse } from 'next';
import { CitiesReqQueryHelper, LoggerHelper, NwsHelper, NwsMapHelper } from 'helpers/api';
import { DataSource } from 'models';
import { Alerts, APIRoute, getPath, Response } from 'models/api';

const LOGGER_LABEL = getPath(APIRoute.ALERTS);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { queriedCity, minimalQueriedCity, warnings } = await CitiesReqQueryHelper.parseQueriedCity(req.query);
    const alerts = await NwsHelper.getAlerts(minimalQueriedCity);

    const data: Alerts = {
      [DataSource.NATIONAL_WEATHER_SERVICE]: NwsMapHelper.mapAlertsToNwsAlerts(alerts, minimalQueriedCity.timeZone),
      [DataSource.QUERIED_CITY]: queriedCity
    };

    const response: Response<Alerts> = {
      data,
      warnings,
      errors: [],
      validUntil: 0,
      latestReadTime: data.nws!.readTime
    };

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
