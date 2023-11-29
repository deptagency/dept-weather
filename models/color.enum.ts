export enum Color {
  WHITE = 'white',
  BLACK = 'black',
  ONYX = 'onyx',
  INDIGO = 'indigo',

  BACKGROUND = 'background',
  FOREGROUND = 'foreground',
  FOREGROUND_LIGHT = 'foreground-light',

  ALERT_EXTREME = 'alert-extreme',
  ALERT_SEVERE = 'alert-severe',
  ALERT_MODERATE = 'alert-moderate',
  ALERT_MINOR = 'alert-minor',
  ALERT_UNKNOWN = 'alert-unknown'
}

export type ColorScheme = 'light' | 'dark';
export type AppTheme = 'auto' | 'system' | ColorScheme;
