import { NextApiRequest, NextApiResponse } from 'next';
import { NumberHelper, WeatherlinkHelper } from '../../helpers';
import { Unit } from '../../models';
import { Observations, Response } from '../../models/api';
import { BarometerSensorData, MainSensorData, SensorType } from '../../models/weatherlink';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const wlResponse = await WeatherlinkHelper.current.get();
    const wlMain = wlResponse.sensors.find(sensor => sensor.sensor_type === SensorType.MAIN)!.data[0] as MainSensorData;
    const wlBarometer = wlResponse.sensors.find(sensor => sensor.sensor_type === SensorType.BAROMETER)!
      .data[0] as BarometerSensorData;

    const fromTempUnit = Unit.F;
    const fromDistanceUnit = Unit.MILES;
    const fromPressureUnit = Unit.INCHES_OF_MERCURY;
    const toTempUnit = (req.query['tempUnit'] as Unit) ?? Unit.F;
    const toDistanceUnit = (req.query['distanceUnit'] as Unit) ?? Unit.MILES;
    const toPressureUnit = (req.query['pressureUnit'] as Unit) ?? Unit.INCHES_OF_MERCURY;

    const response: Response<Observations> = {
      data: {
        textDescription: null,
        temperature: NumberHelper.convert(wlMain.temp, fromTempUnit, toTempUnit),
        feelsLike: NumberHelper.convert(wlMain.thsw_index ?? wlMain.thw_index, fromTempUnit, toTempUnit),
        humidity: NumberHelper.round(wlMain.hum, 0),
        dewPoint: NumberHelper.convert(wlMain.dew_point, fromTempUnit, toTempUnit),
        wind: {
          speed: NumberHelper.convert(wlMain.wind_speed_avg_last_10_min, fromDistanceUnit, toDistanceUnit),
          direction: NumberHelper.round(wlMain.wind_dir_scalar_avg_last_10_min, 0),
          gustSpeed: NumberHelper.convert(wlMain.wind_speed_hi_last_10_min, fromDistanceUnit, toDistanceUnit)
        },
        pressure: {
          atSeaLevel: NumberHelper.convert(
            wlBarometer.bar_sea_level,
            fromPressureUnit,
            toPressureUnit,
            toPressureUnit === Unit.INCHES_OF_MERCURY ? 2 : 1
          ),
          trend: NumberHelper.convert(
            wlBarometer.bar_trend,
            fromPressureUnit,
            toPressureUnit,
            toPressureUnit === Unit.INCHES_OF_MERCURY ? 3 : 1
          )
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
    console.log('[/api/weatherlink-current]', err);
    const errorResponse: Response<null> = { data: null, warnings: [], errors: ['Failed to fetch data'], validUntil: 0 };
    res.status(500).json(errorResponse);
  }
}
