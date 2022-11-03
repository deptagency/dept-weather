import dayjs from 'dayjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { CITY_SEARCH_RESULTS_MAX_AGE } from '../../constants';
import { CitiesHelper } from '../../helpers/api';
import { APIRoute, getPath, Response } from '../../models/api';
import { City } from '../../models/cities';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const results = await CitiesHelper.searchFor(req.query);

    const response: Response<City[]> = {
      data: results,
      warnings: [],
      errors: [],
      validUntil: dayjs().unix() + CITY_SEARCH_RESULTS_MAX_AGE,
      latestReadTime: dayjs().unix()
    };
    if (process.env.NODE_ENV !== 'development') {
      res.setHeader(
        'Cache-Control',
        `public, immutable, stale-while-revalidate, max-age=${CITY_SEARCH_RESULTS_MAX_AGE}`
      );
    }
    res.status(200).json(response);
  } catch (err) {
    console.log(`[${getPath(APIRoute.CITY_SEARCH)}]`, err);
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
