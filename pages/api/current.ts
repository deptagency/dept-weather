import { NextApiRequest, NextApiResponse } from 'next';
import { AQ_COORDINATES } from '../../constants';
import { NwsHelper, WeatherlinkHelper } from '../../helpers';
import { DataSource } from '../../models';
import { APIRoute, getPath, Observations, Response } from '../../models/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const coordinates = AQ_COORDINATES;
    const [wlCurrent, nwsCurrent] = await Promise.all([
      WeatherlinkHelper.getCurrent(),
      NwsHelper.getCurrent(coordinates)
    ]);
    const validUntil = Math.min(wlCurrent.validUntil, nwsCurrent.validUntil);
    const maxAge = Math.min(wlCurrent.maxAge, nwsCurrent.maxAge);

    const response: Response<Observations> = {
      data: {
        [DataSource.WEATHERLINK]: WeatherlinkHelper.mapCurrentToWlObservations(wlCurrent, req.query),
        [DataSource.NATIONAL_WEATHER_SERVICE]: NwsHelper.mapCurrentToNwsObservations(nwsCurrent, req.query)
      },
      warnings: [],
      errors: [],
      validUntil
    };

    res.setHeader('Cache-Control', `public, immutable, stale-while-revalidate, max-age=${maxAge}`);
    res.status(200).json(response);
  } catch (err) {
    console.log(`[${getPath(APIRoute.CURRENT)}]`, err);
    const errorResponse: Response<null> = { data: null, warnings: [], errors: ['Failed to fetch data'], validUntil: 0 };
    res.status(500).json(errorResponse);
  }
}
