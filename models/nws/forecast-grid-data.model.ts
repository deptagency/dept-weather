import { Geometry } from './geometry.model';
import {
  GridpointQuantitativeValueLayer,
  QuantitativeMinMaxValue,
  QuantitativeValue
} from './quantitative-value.model';

export interface ForecastGridDataResponse {
  geometry: Geometry;
  properties: ForecastGridData;
}

export interface ForecastGridDataDatapoints {
  temperature: GridpointQuantitativeValueLayer;
  dewpoint: GridpointQuantitativeValueLayer;
  maxTemperature: GridpointQuantitativeValueLayer;
  minTemperature: GridpointQuantitativeValueLayer;
  relativeHumidity: GridpointQuantitativeValueLayer;
  apparentTemperature: GridpointQuantitativeValueLayer;
  heatIndex: GridpointQuantitativeValueLayer;
  windChill: GridpointQuantitativeValueLayer;
  skyCover: GridpointQuantitativeValueLayer;
  windDirection: GridpointQuantitativeValueLayer;
  windSpeed: GridpointQuantitativeValueLayer;
  windGust: GridpointQuantitativeValueLayer;
  weather: Weather;
  hazards: Hazards;
  probabilityOfPrecipitation: GridpointQuantitativeValueLayer;
  quantitativePrecipitation: GridpointQuantitativeValueLayer;
  iceAccumulation: GridpointQuantitativeValueLayer;
  snowfallAmount: GridpointQuantitativeValueLayer;
  visibility: GridpointQuantitativeValueLayer;
  pressure: GridpointQuantitativeValueLayer;
}

export interface ForecastGridData extends ForecastGridDataDatapoints {
  updateTime: string;
  validTimes: string;
  elevation: QuantitativeValue;
  forecastOffice: string;
  gridId: string;
  gridX: string;
  gridY: string;
}

export interface Weather {
  values: WeatherValueLayer[];
}

export interface WeatherValueLayer {
  validTime: string;
  value: WeatherValue[];
}

export interface WeatherValue {
  coverage: WeatherCoverage | null;
  weather: WeatherType | null;
  intensity: WeatherIntensity | null;
  visibility: QuantitativeValue | QuantitativeMinMaxValue;
  attributes: WeatherAttribute[];
}

export enum WeatherCoverage {
  AREAS = 'areas',
  BRIEF = 'brief',
  CHANCE = 'chance',
  DEFINITE = 'definite',
  FEW = 'few',
  FREQUENT = 'frequent',
  INTERMITTENT = 'intermittent',
  ISOLATED = 'isolated',
  LIKELY = 'likely',
  NUMEROUS = 'numerous',
  OCCASIONAL = 'occasional',
  PATCHY = 'patchy',
  PERIODS = 'periods',
  SCATTERED = 'scattered',
  SLIGHT_CHANCE = 'slight_chance',
  WIDESPREAD = 'widespread'
}

export enum WeatherType {
  BLOWING_DUST = 'blowing_dust',
  BLOWING_SAND = 'blowing_sand',
  BLOWING_SNOW = 'blowing_snow',
  DRIZZLE = 'drizzle',
  FOG = 'fog',
  FREEZING_FOG = 'freezing_fog',
  FREEZING_DRIZZLE = 'freezing_drizzle',
  FREEZING_RAIN = 'freezing_rain',
  FREEZING_SPRAY = 'freezing_spray',
  FROST = 'frost',
  HAIL = 'hail',
  HAZE = 'haze',
  ICE_CRYSTALS = 'ice_crystals',
  ICE_FOG = 'ice_fog',
  RAIN = 'rain',
  RAIN_SHOWERS = 'rain_showers',
  SLEET = 'sleet',
  SMOKE = 'smoke',
  SNOW = 'snow',
  SNOW_SHOWERS = 'snow_showers',
  THUNDERSTORMS = 'thunderstorms',
  VOLCANIC_ASH = 'volcanic_ash',
  WATER_SPOUTS = 'water_spouts'
}

export enum WeatherIntensity {
  VERY_LIGHT = 'very_light',
  LIGHT = 'light',
  MODERATE = 'moderate',
  HEAVY = 'heavy'
}

export enum WeatherAttribute {
  DAMAGING_WIND = 'damaging_wind',
  DRY_THUNDERSTORMS = 'dry_thunderstorms',
  FLOODING = 'flooding',
  GUSTY_WIND = 'gusty_wind',
  HEAVY_RAIN = 'heavy_rain',
  LARGE_HAIL = 'large_hail',
  SMALL_HAIL = 'small_hail',
  TORNADOES = 'tornadoes'
}

export interface Hazards {
  values: HazardValueGroup[];
}

export interface HazardValueGroup {
  validTime: string;
  value: HazardValue;
}

export interface HazardValue {
  phenomenon: string;
  significance: string;
  event_number: number | null;
}
