import { default as WeatherLink } from 'weatherlink';
import { CurrentConditions, SensorType } from '../models/weatherlink';
import { Cached } from './cached';

export class WeatherlinkHelper {
  private static readonly apiKey = process.env.WEATHERLINK_API_KEY!;
  private static readonly apiSecret = process.env.WEATHERLINK_API_SECRET!;
  private static readonly wl = WeatherLink({ apiKey: this.apiKey, apiSecret: this.apiSecret });

  private static readonly getAllStationsPromise = this.wl.getAllStations();
  private static async getMainStation() {
    return (await this.getAllStationsPromise).stations[0];
  }

  static readonly current = new Cached<CurrentConditions>(
    async () => this.wl.getCurrent({ stationId: (await this.getMainStation()).station_id }),
    async (newItem: CurrentConditions) => {
      const lastReading = newItem.sensors.find(sensor => sensor.sensor_type === SensorType.MAIN)?.data[0]?.ts ?? 0;
      const recordingInterval = (await this.getMainStation()).recording_interval * 60;
      return lastReading ? lastReading + recordingInterval + 10 : 0;
    },
    true,
    '[WeatherlinkHelper.current] '
  );
}
