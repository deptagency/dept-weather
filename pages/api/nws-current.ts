import { NextApiRequest, NextApiResponse } from 'next';
import { NwsHelper } from '../../helpers';
import { NwsObservations, Response } from '../../models/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const nwsResponse = await NwsHelper.current.get();

    const response: Response<NwsObservations> = {
      data: NwsHelper.mapCurrentToNwsObservations(nwsResponse, req.query),
      warnings: [],
      errors: [],
      validUntil: NwsHelper.current.validUntil
    };

    res.setHeader('Cache-Control', `public, immutable, stale-while-revalidate, max-age=${NwsHelper.current.maxAge}`);
    res.status(200).json(response);
  } catch (err) {
    console.log('[/api/nws-current]', err);
    const errorResponse: Response<null> = { data: null, warnings: [], errors: ['Failed to fetch data'], validUntil: 0 };
    res.status(500).json(errorResponse);
  }
}
