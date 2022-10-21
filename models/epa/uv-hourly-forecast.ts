export type UVHourlyForecast = Array<UVHourlyForecastItem>;

export interface UVHourlyForecastItem {
  ORDER: number;
  CITY: string;
  STATE: string;
  DATE_TIME: string;
  UV_VALUE: number;
}
