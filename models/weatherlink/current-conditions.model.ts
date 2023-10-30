import { SensorType } from 'models/weatherlink/sensor-type.enum';

export interface CurrentConditions {
  sensors: Sensor[];
  generated_at: number;
  station_id: number;
}

export interface Sensor {
  lsid: number;
  sensor_type: SensorType;
  data: Array<
    | MainSensorData
    | BarometerSensorData
    | InsideSensorData
    | AirQualitySensorData
    | LiveHealthSensorData
    | AqsHealthSensorData
  >;
  data_structure_type: number;
}

export enum RxState {
  SYNCED = 0,
  RESCAN = 1,
  LOST = 2
}

export enum BatteryState {
  OK = 0,
  LOW = 1
}

export enum NetworkType {
  WI_FI = 1,
  ETHERNET = 2
}

export enum IPAddressType {
  DYNAMIC = 1,
  SECONDARY = 2,
  PUBLIC = 3
}

export enum DnsType {
  PRIMARY = 1,
  SECONDARY = 2,
  PUBLIC = 3
}

export interface BaseSensorData {
  ts: number;
}

export interface TemperatureData {
  temp: number;
  hum: number;
  dew_point: number;
  wet_bulb: number;
  heat_index: number;
}

export interface HealthData {
  health_version: number;
  firmware_version: number;
  uptime: number;
  ip_address_type: IPAddressType;
  ip_v4_address: string;
  ip_v4_gateway: string;
  ip_v4_netmask: string;
  dns_type_used: DnsType;
  local_api_queries: number;
  wifi_rssi: number;
  link_uptime: number;
  network_error: number;
  bootloader_version: number;
}

export interface MainSensorData extends BaseSensorData, TemperatureData {
  wind_chill: number;
  thw_index: number;
  thsw_index: number;
  wind_speed_last: number;
  wind_dir_last: number;
  wind_speed_avg_last_1_min: number;
  wind_dir_scalar_avg_last_1_min: number;
  wind_speed_avg_last_2_min: number;
  wind_dir_scalar_avg_last_2_min: number;
  wind_speed_hi_last_2_min: number;
  wind_dir_at_hi_speed_last_2_min: number;
  wind_speed_avg_last_10_min: number;
  wind_dir_scalar_avg_last_10_min: number;
  wind_speed_hi_last_10_min: number;
  wind_dir_at_hi_speed_last_10_min: number;
  rain_size: number;
  rain_rate_last_clicks: number;
  rain_rate_last_in: number;
  rain_rate_last_mm: number;
  rain_rate_hi_clicks: number;
  rain_rate_hi_in: number;
  rain_rate_hi_mm: number;
  rainfall_last_15_min_clicks: number;
  rainfall_last_15_min_in: number;
  rainfall_last_15_min_mm: number;
  rain_rate_hi_last_15_min_clicks: number;
  rain_rate_hi_last_15_min_in: number;
  rain_rate_hi_last_15_min_mm: number;
  rainfall_last_60_min_clicks: number;
  rainfall_last_60_min_in: number;
  rainfall_last_60_min_mm: number;
  rainfall_last_24_hr_clicks: number;
  rainfall_last_24_hr_in: number;
  rainfall_last_24_hr_mm: number;
  rain_storm_clicks: number;
  rain_storm_in: number;
  rain_storm_mm: number;
  rain_storm_start_at: number;
  solar_rad: number;
  uv_index: number;
  rx_state: RxState;
  trans_battery_flag: BatteryState;
  rainfall_daily_clicks: number;
  rainfall_daily_in: number;
  rainfall_daily_mm: number;
  rainfall_monthly_clicks: number;
  rainfall_monthly_in: number;
  rainfall_monthly_mm: number;
  rainfall_year_clicks: number;
  rainfall_year_in: number;
  rainfall_year_mm: number;
  rain_storm_last_clicks: number;
  rain_storm_last_in: number;
  rain_storm_last_mm: number;
  rain_storm_last_start_at: number;
  rain_storm_last_end_at: number;
  tx_id: number;
}

export interface BarometerSensorData extends BaseSensorData {
  bar_absolute: number;
  bar_sea_level: number;
  bar_offset: number;
  bar_trend: number;
}

export interface InsideSensorData extends BaseSensorData {
  temp_in: number;
  heat_index_in: number;
  dew_point_in: number;
  hum_in: number;
}

export interface AirQualitySensorData extends BaseSensorData, TemperatureData {
  pm_1: number;
  pm_2p5: number;
  pm_2p5_1_hour: number;
  pm_2p5_3_hour: number;
  pm_2p5_nowcast: number;
  pm_2p5_24_hour: number;
  pm_10: number;
  pm_10_1_hour: number;
  pm_10_3_hour: number;
  pm_10_nowcast: number;
  pm_10_24_hour: number;
  last_report_time: number;
  pct_pm_data_1_hour: number;
  pct_pm_data_3_hour: number;
  pct_pm_data_nowcast: number;
  pct_pm_data_24_hour: number;
  aqi_type: string;
  aqi_val: number;
  aqi_desc: string;
  aqi_1_hour_val: number;
  aqi_1_hour_desc: string;
  aqi_nowcast_val: number;
  aqi_nowcast_desc: string;
}

export interface LiveHealthSensorData extends BaseSensorData, HealthData {
  bluetooth_version: number;
  radio_version: number;
  espressif_version: number;
  battery_voltage: number;
  input_voltage: number;
  bgn: number;
  network_type: NetworkType;
  rx_bytes: number;
  tx_bytes: number;
  rapid_records_sent: number;
  touchpad_wakeups: number;
}

export interface AqsHealthSensorData extends BaseSensorData, HealthData {
  application_version: string;
  application_sha: string;
  rx_packets: number;
  tx_packets: number;
  dropped_packets: number;
  packet_errors: number;
  total_free_mem: number;
  total_used_mem: number;
  internal_free_mem: number;
  internal_used_mem: number;
  internal_free_mem_watermark: number;
  internal_free_mem_chunk_size: number;
  record_write_count: number;
  record_stored_count: number;
  record_backlog_count: number;
}
