import { NextApiRequest, NextApiResponse } from 'next';
import { WeatherlinkHelper } from '../../helpers';
import { Response, WlObservations } from '../../models/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const wlResponse = await WeatherlinkHelper.current.get();

    const response: Response<WlObservations> = {
      data: WeatherlinkHelper.mapCurrentToWlObservations(wlResponse, req.query),
      warnings: [],
      errors: [],
      validUntil: WeatherlinkHelper.current.validUntil
    };

    res.setHeader(
      'Cache-Control',
      `public, immutable, stale-while-revalidate, max-age=${WeatherlinkHelper.current.maxAge}`
    );
    res.status(200).json(response);
  } catch (err) {
    console.log('[/api/weatherlink-current]', err);
    const errorResponse: Response<null> = { data: null, warnings: [], errors: ['Failed to fetch data'], validUntil: 0 };
    res.status(500).json(errorResponse);
  }
}
