import { NextApiRequest, NextApiResponse } from 'next';
import { WeatherlinkHelper } from '../../helpers';
import { Observations, Response } from '../../models/api';
import { MainSensorData, SensorType } from '../../models/weatherlink';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const current = await WeatherlinkHelper.current.get();
    const mainSensor = current.sensors.find(sensor => sensor.sensor_type === SensorType.MAIN)!
      .data[0] as MainSensorData;
    const response: Response<Observations> = {
      data: {
        temperature: mainSensor.temp,
        feelsLike: mainSensor.thsw_index ?? mainSensor.thw_index,
        humidity: mainSensor.hum,
        wind: {
          speed: mainSensor.wind_speed_avg_last_10_min,
          direction: mainSensor.wind_dir_scalar_avg_last_10_min,
          gustSpeed: mainSensor.wind_speed_hi_last_10_min
        }
      },
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
    console.log('[/api/current]', err);
    const errorResponse: Response<null> = { data: null, warnings: [], errors: ['Failed to fetch data'], validUntil: 0 };
    res.status(500).json(errorResponse);
  }
}
