import turf from '@turf/distance';
import { default as WeatherLink } from 'weatherlink';
import { AQ_COORDINATES_STR, DEFAULT_UNITS } from '../constants';
import { Unit, UnitType } from '../models';
import { ReqQuery, WlObservations } from '../models/api';
import { BarometerSensorData, CurrentConditions, MainSensorData, SensorType } from '../models/weatherlink';
import { Cached, CacheEntry } from './cached';
import { CoordinatesHelper } from './coordinates-helper';
import { NumberHelper } from './number-helper';

export class WeatherlinkHelper {
  private static readonly apiKey = process.env.WEATHERLINK_API_KEY!;
  private static readonly apiSecret = process.env.WEATHERLINK_API_SECRET!;
  private static readonly wl = WeatherLink({ apiKey: this.apiKey, apiSecret: this.apiSecret });

  private static readonly getAllStationsPromise = this.wl.getAllStations();
  private static async getMainStation() {
    return (await this.getAllStationsPromise).stations[0];
  }

  static shouldUse(coordinatesStr: string) {
    const distanceToAQ = turf(
      CoordinatesHelper.strToNumArr(AQ_COORDINATES_STR),
      CoordinatesHelper.strToNumArr(coordinatesStr),
      {
        units: Unit.MILES
      }
    );
    return distanceToAQ < 5;
  }

  private static readonly current = new Cached<CurrentConditions, undefined>(
    async () => this.wl.getCurrent({ stationId: (await this.getMainStation()).station_id }),
    async (_: string, newItem: CurrentConditions) => {
      const lastReading = newItem.sensors.find(sensor => sensor.sensor_type === SensorType.MAIN)?.data[0]?.ts ?? 0;
      const recordingInterval = (await this.getMainStation()).recording_interval * 60;
      return lastReading ? lastReading + recordingInterval + 10 : 0;
    },
    true,
    '[WeatherlinkHelper.current]'
  );
  static async getCurrent(coordinatesStr: string) {
    return this.current.get(coordinatesStr, undefined);
  }

  static mapCurrentToWlObservations(cacheEntry: CacheEntry<CurrentConditions>, reqQuery: ReqQuery): WlObservations {
    const wlMain = cacheEntry.item.sensors.find(sensor => sensor.sensor_type === SensorType.MAIN)!
      .data[0] as MainSensorData;
    const wlBarometer = cacheEntry.item.sensors.find(sensor => sensor.sensor_type === SensorType.BAROMETER)!
      .data[0] as BarometerSensorData;

    const units = NumberHelper.getUnitMappings(DEFAULT_UNITS, reqQuery);

    return {
      readTime: wlMain.ts ?? 0,
      validUntil: cacheEntry.validUntil,
      temperature: NumberHelper.convert(wlMain.temp, units[UnitType.temp]),
      heatIndex: NumberHelper.convert(wlMain.heat_index, units[UnitType.temp]),
      dewPoint: NumberHelper.convert(wlMain.dew_point, units[UnitType.temp]),
      humidity: NumberHelper.round(wlMain.hum, 0),
      wind: {
        speed: NumberHelper.convert(wlMain.wind_speed_avg_last_10_min, units[UnitType.wind]),
        direction: NumberHelper.round(wlMain.wind_dir_scalar_avg_last_10_min, 0),
        gustSpeed: NumberHelper.convert(wlMain.wind_speed_hi_last_10_min, units[UnitType.wind])
      },
      feelsLike: NumberHelper.convert(wlMain.thsw_index ?? wlMain.thw_index, units[UnitType.temp]),
      pressure: {
        atSeaLevel: NumberHelper.convert(
          wlBarometer.bar_sea_level,
          units[UnitType.pressure],
          units[UnitType.pressure].to === Unit.INCHES ? 2 : 1
        ),
        trend: NumberHelper.convert(
          wlBarometer.bar_trend,
          units[UnitType.pressure],
          units[UnitType.pressure].to === Unit.INCHES ? 3 : 1
        )
      },
      rainfall: {
        last15Mins: NumberHelper.convert(wlMain.rainfall_last_15_min_in, units[UnitType.precipitation], 2),
        last1Hrs: NumberHelper.convert(wlMain.rainfall_last_60_min_in, units[UnitType.precipitation], 2),
        last24Hrs: NumberHelper.convert(wlMain.rainfall_last_24_hr_in, units[UnitType.precipitation], 2)
      }
    };
  }
}
