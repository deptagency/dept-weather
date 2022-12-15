export enum IconCondition {
  BREEZY = 'BREEZY',
  CLEAR = 'CLEAR',
  CLEAR_MOSTLY = 'MOSTLY CLEAR',
  CLOUDINESS_CONSIDERABLE = 'CONSIDERABLE CLOUDINESS',
  CLOUDY = 'CLOUDY',
  CLOUDY_MOSTLY = 'MOSTLY CLOUDY',
  CLOUDY_PARTLY = 'PARTLY CLOUDY',
  DRIZZLE = 'DRIZZLE',
  DRIZZLE_LIGHT = 'LIGHT DRIZZLE',
  FOG = 'FOG',
  FOG_MIST = 'FOG/MIST',
  FOG_PATCHY = 'PATCHY FOG',
  HAIL = 'HAIL',
  HAZE = 'HAZE',
  HURRICANE = 'HURRICANE',
  MIST = 'MIST',
  RAIN = 'RAIN',
  RAIN_HEAVY = 'HEAVY RAIN',
  RAIN_LIGHT = 'LIGHT RAIN',
  RAIN_SHOWERS = 'RAIN SHOWERS',
  RAIN_FREEZING = 'FREEZING RAIN',
  RAINBOW = 'RAINBOW',
  SHOWERS = 'SHOWERS',
  SLEET = 'SLEET',
  SMOKE = 'SMOKE',
  SNOW = 'SNOW',
  SNOW_HEAVY = 'HEAVY SNOW',
  SNOW_LIGHT = 'LIGHT SNOW',
  SNOW_SHOWERS = 'SNOW SHOWERS',
  SQUALLS = 'SQUALLS',
  SUNNY = 'SUNNY',
  SUNNY_MOSTLY = 'MOSTLY SUNNY',
  SUNNY_PARTLY = 'PARTLY SUNNY',
  THUNDERSHOWERS = 'THUNDERSHOWERS',
  THUNDERSNOW = 'THUNDERSNOW',
  THUNDERSTORMS = 'THUNDERSTORMS',
  THUNDERSTORMS_HEAVY = 'HEAVY THUNDERSTORMS',
  THUNDERSTORMS_HAIL = 'THUNDERSTORMS AND HAIL',
  UNKNOWN_PRECIPITATION = 'UNKNOWN PRECIPITATION',
  WINDY = 'WINDY'
}

export enum DefaultSetIcon {
  CLEAR_DAY = 'clear-day.svg',
  CLEAR_NIGHT = 'clear-night.svg',
  CLOUDY_MOSTLY = 'cloudy-mostly.svg',
  CLOUDY_PARTLY_DAY = 'cloudy-partly-day.svg',
  CLOUDY_PARTLY_NIGHT = 'cloudy-partly-night.svg',
  CLOUDY = 'cloudy.svg',
  FOG = 'fog.svg',
  HAIL = 'hail.svg',
  HURRICANE = 'hurricane.svg',
  RAIN_HEAVY = 'rain-heavy.svg',
  RAIN = 'rain.svg',
  RAINBOW = 'rainbow.svg',
  SNOW = 'snow.svg',
  THUNDERSHOWERS = 'thundershowers.svg',
  THUNDERSNOW = 'thundersnow.svg',
  THUNDERSTORMS = 'thunderstorms.svg',
  THUNDERSTORMS_HAIL = 'thunderstorms-hail.svg',
  WINDY = 'windy.svg'
}

export type DefaultIconMapping = { day: DefaultSetIcon; night: DefaultSetIcon } | DefaultSetIcon;

const DEFAULT_CLEAR_ICONS: DefaultIconMapping = {
  day: DefaultSetIcon.CLEAR_DAY,
  night: DefaultSetIcon.CLEAR_NIGHT
};

const DEFAULT_PARTLY_CLOUDY_ICONS: DefaultIconMapping = {
  day: DefaultSetIcon.CLOUDY_PARTLY_DAY,
  night: DefaultSetIcon.CLOUDY_PARTLY_NIGHT
};

export const DefaultIcons: Record<IconCondition, DefaultIconMapping> = {
  [IconCondition.BREEZY]: DefaultSetIcon.WINDY,
  [IconCondition.CLEAR]: DEFAULT_CLEAR_ICONS,
  [IconCondition.CLEAR_MOSTLY]: DEFAULT_CLEAR_ICONS,
  [IconCondition.CLOUDINESS_CONSIDERABLE]: DefaultSetIcon.CLOUDY_MOSTLY,
  [IconCondition.CLOUDY]: DefaultSetIcon.CLOUDY,
  [IconCondition.CLOUDY_MOSTLY]: DefaultSetIcon.CLOUDY_MOSTLY,
  [IconCondition.CLOUDY_PARTLY]: DEFAULT_PARTLY_CLOUDY_ICONS,
  [IconCondition.DRIZZLE]: DefaultSetIcon.RAIN,
  [IconCondition.DRIZZLE_LIGHT]: DefaultSetIcon.RAIN,
  [IconCondition.FOG]: DefaultSetIcon.FOG,
  [IconCondition.FOG_MIST]: DefaultSetIcon.FOG,
  [IconCondition.FOG_PATCHY]: DefaultSetIcon.FOG,
  [IconCondition.HAIL]: DefaultSetIcon.HAIL,
  [IconCondition.HAZE]: DefaultSetIcon.FOG,
  [IconCondition.HURRICANE]: DefaultSetIcon.HURRICANE,
  [IconCondition.MIST]: DefaultSetIcon.RAIN,
  [IconCondition.RAIN]: DefaultSetIcon.RAIN,
  [IconCondition.RAIN_HEAVY]: DefaultSetIcon.RAIN,
  [IconCondition.RAIN_LIGHT]: DefaultSetIcon.RAIN,
  [IconCondition.RAIN_SHOWERS]: DefaultSetIcon.RAIN,
  [IconCondition.RAIN_FREEZING]: DefaultSetIcon.RAIN,
  [IconCondition.RAINBOW]: DefaultSetIcon.RAINBOW,
  [IconCondition.SHOWERS]: DefaultSetIcon.RAIN,
  [IconCondition.SLEET]: DefaultSetIcon.SNOW,
  [IconCondition.SMOKE]: DefaultSetIcon.FOG,
  [IconCondition.SNOW]: DefaultSetIcon.SNOW,
  [IconCondition.SNOW_HEAVY]: DefaultSetIcon.SNOW,
  [IconCondition.SNOW_LIGHT]: DefaultSetIcon.SNOW,
  [IconCondition.SNOW_SHOWERS]: DefaultSetIcon.SNOW,
  [IconCondition.SQUALLS]: DefaultSetIcon.SNOW,
  [IconCondition.SUNNY]: DEFAULT_CLEAR_ICONS,
  [IconCondition.SUNNY_MOSTLY]: DEFAULT_CLEAR_ICONS,
  [IconCondition.SUNNY_PARTLY]: DEFAULT_PARTLY_CLOUDY_ICONS,
  [IconCondition.THUNDERSHOWERS]: DefaultSetIcon.THUNDERSHOWERS,
  [IconCondition.THUNDERSNOW]: DefaultSetIcon.THUNDERSNOW,
  [IconCondition.THUNDERSTORMS]: DefaultSetIcon.THUNDERSTORMS,
  [IconCondition.THUNDERSTORMS_HEAVY]: DefaultSetIcon.THUNDERSTORMS,
  [IconCondition.THUNDERSTORMS_HAIL]: DefaultSetIcon.THUNDERSTORMS_HAIL,
  [IconCondition.UNKNOWN_PRECIPITATION]: DefaultSetIcon.RAIN,
  [IconCondition.WINDY]: DefaultSetIcon.WINDY
};
