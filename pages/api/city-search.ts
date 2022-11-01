import { NextApiRequest, NextApiResponse } from 'next';
import { CITY_SEARCH_RESULTS_MAX_AGE } from '../../constants';
import { CitiesHelper } from '../../helpers';
import { APIRoute, getPath, Response } from '../../models/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const results = await CitiesHelper.searchFor(req.query);

    res.setHeader('Cache-Control', `public, immutable, stale-while-revalidate, max-age=${CITY_SEARCH_RESULTS_MAX_AGE}`);
    res.status(200).json(results);
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
