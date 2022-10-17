import { NextApiRequest, NextApiResponse } from 'next';
import { NumberHelper, NwsHelper } from '../../helpers';
import { Unit } from '../../models';
import { Observations, Response } from '../../models/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const current = (await NwsHelper.current.get()).properties;

    const toTempUnit = (req.query['tempUnit'] as Unit) ?? Unit.F;
    const toDistanceUnit = (req.query['distanceUnit'] as Unit) ?? Unit.MILES;
    const toPressureUnit = (req.query['pressureUnit'] as Unit) ?? Unit.INCHES_OF_MERCURY;

    const response: Response<Observations> = {
      data: {
        temperature: NumberHelper.convertNws(current.temperature, toTempUnit),
        feelsLike: NumberHelper.convertNws(current.heatIndex, toTempUnit),
        humidity: NumberHelper.roundNws(current.relativeHumidity),
        dewPoint: NumberHelper.convertNws(current.dewpoint, toTempUnit),
        wind: {
          speed: NumberHelper.convertNws(current.windSpeed, toDistanceUnit),
          direction: current.windDirection.value,
          gustSpeed: NumberHelper.convertNws(current.windGust, toDistanceUnit)
        },
        pressure: {
          atSeaLevel: NumberHelper.convertNws(
            current.seaLevelPressure,
            toPressureUnit,
            toPressureUnit === Unit.INCHES_OF_MERCURY ? 2 : 1
          ),
          trend: null
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
