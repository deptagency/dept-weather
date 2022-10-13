import { NextApiRequest, NextApiResponse } from 'next';
import { NumberHelper, NwsHelper } from '../../helpers';
import { Unit } from '../../models';
import { Observations, Response } from '../../models/api';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const current = (await NwsHelper.current.get()).properties;

    const response: Response<Observations> = {
      data: {
        temperature: NumberHelper.convertNws(current.temperature, Unit.F),
        feelsLike: NumberHelper.convertNws(current.heatIndex, Unit.F),
        humidity: NumberHelper.roundNws(current.relativeHumidity),
        wind: {
          speed: NumberHelper.convertNws(current.windSpeed, Unit.MILES),
          direction: current.windDirection.value,
          gustSpeed: NumberHelper.convertNws(current.windGust, Unit.MILES)
        }
      },
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
