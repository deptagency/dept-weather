export enum IconCondition {
  BREEZY = 'BREEZY',
  CLEAR = 'CLEAR',
  CLEAR_MOSTLY = 'MOSTLY CLEAR',
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
  RAINBOW = 'RAINBOW',
  SMOKE = 'SMOKE',
  SNOW = 'SNOW',
  SNOW_HEAVY = 'HEAVY SNOW',
  SNOW_LIGHT = 'LIGHT SNOW',
  SQUALLS = 'SQUALLS',
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

export const DefaultIcons: Record<IconCondition, DefaultIconMapping> = {
  [IconCondition.BREEZY]: DefaultSetIcon.WINDY,
  [IconCondition.CLEAR]: {
    day: DefaultSetIcon.CLEAR_DAY,
    night: DefaultSetIcon.CLEAR_NIGHT
  },
  [IconCondition.CLEAR_MOSTLY]: {
    day: DefaultSetIcon.CLEAR_DAY,
    night: DefaultSetIcon.CLEAR_NIGHT
  },
  [IconCondition.CLOUDY]: DefaultSetIcon.CLOUDY,
  [IconCondition.CLOUDY_MOSTLY]: DefaultSetIcon.CLOUDY_MOSTLY,
  [IconCondition.CLOUDY_PARTLY]: {
    day: DefaultSetIcon.CLOUDY_PARTLY_DAY,
    night: DefaultSetIcon.CLOUDY_PARTLY_NIGHT
  },
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
  [IconCondition.RAINBOW]: DefaultSetIcon.RAINBOW,
  [IconCondition.SMOKE]: DefaultSetIcon.FOG,
  [IconCondition.SNOW]: DefaultSetIcon.SNOW,
  [IconCondition.SNOW_HEAVY]: DefaultSetIcon.SNOW,
  [IconCondition.SNOW_LIGHT]: DefaultSetIcon.SNOW,
  [IconCondition.SQUALLS]: DefaultSetIcon.SNOW,
  [IconCondition.THUNDERSHOWERS]: DefaultSetIcon.THUNDERSHOWERS,
  [IconCondition.THUNDERSNOW]: DefaultSetIcon.THUNDERSNOW,
  [IconCondition.THUNDERSTORMS]: DefaultSetIcon.THUNDERSTORMS,
  [IconCondition.THUNDERSTORMS_HEAVY]: DefaultSetIcon.THUNDERSTORMS,
  [IconCondition.THUNDERSTORMS_HAIL]: DefaultSetIcon.THUNDERSTORMS_HAIL,
  [IconCondition.UNKNOWN_PRECIPITATION]: DefaultSetIcon.RAIN,
  [IconCondition.WINDY]: DefaultSetIcon.WINDY
};
