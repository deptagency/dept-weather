import { NextApiRequest, NextApiResponse } from 'next';
import { NwsHelper, WeatherlinkHelper } from '../../helpers';
import { DataSource } from '../../models';
import { Observations, Response } from '../../models/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [wlResponse, nwsResponse] = await Promise.all([WeatherlinkHelper.current.get(), NwsHelper.current.get()]);
    const validUntil = Math.min(WeatherlinkHelper.current.validUntil, NwsHelper.current.validUntil);
    const maxAge = Math.min(WeatherlinkHelper.current.maxAge, NwsHelper.current.maxAge);

    const response: Response<Observations> = {
      data: {
        [DataSource.WEATHERLINK]: WeatherlinkHelper.mapCurrentToWlObservations(
          wlResponse,
          WeatherlinkHelper.current.validUntil,
          req.query
        ),
        [DataSource.NATIONAL_WEATHER_SERVICE]: NwsHelper.mapCurrentToNwsObservations(
          nwsResponse,
          NwsHelper.current.validUntil,
          req.query
        )
      },
      warnings: [],
      errors: [],
      validUntil
    };

    res.setHeader('Cache-Control', `public, immutable, stale-while-revalidate, max-age=${maxAge}`);
    res.status(200).json(response);
  } catch (err) {
    console.log('[/api/current]', err);
    const errorResponse: Response<null> = { data: null, warnings: [], errors: ['Failed to fetch data'], validUntil: 0 };
    res.status(500).json(errorResponse);
  }
}
