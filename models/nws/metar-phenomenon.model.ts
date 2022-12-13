export interface MetarPhenomenon {
  description?: string;
  intensity?: MetarIntensity;
  modifier?: MetarModifier;
  weather: MetarWeather;
  rawString: string;
  inVicinity?: boolean;
}

export enum MetarIntensity {
  LIGHT = 'light',
  HEAVY = 'heavy'
}

export enum MetarModifier {
  PATCHES = 'patches',
  BLOWING = 'blowing',
  LOW_DRIFTING = 'low_drifting',
  FREEZING = 'freezing',
  SHALLOW = 'shallow',
  PARTIAL = 'partial',
  SHOWERS = 'showers'
}

export enum MetarWeather {
  FOG_MIST = 'fog_mist',
  DUST_STORM = 'dust_storm',
  DUST = 'dust',
  DRIZZLE = 'drizzle',
  FUNNEL_CLOUD = 'funnel_cloud',
  FOG = 'fog',
  SMOKE = 'smoke',
  HAIL = 'hail',
  SNOW_PELLETS = 'snow_pellets',
  HAZE = 'haze',
  ICE_CRYSTALS = 'ice_crystals',
  ICE_PELLETS = 'ice_pellets',
  DUST_WHIRLS = 'dust_whirls',
  SPRAY = 'spray',
  RAIN = 'rain',
  SAND = 'sand',
  SNOW_GRAINS = 'snow_grains',
  SNOW = 'snow',
  SQUALLS = 'squalls',
  SAND_STORM = 'sand_storm',
  THUNDERSTORMS = 'thunderstorms',
  UNKNOWN = 'unknown',
  VOLCANIC_ASH = 'volcanic_ash'
}
