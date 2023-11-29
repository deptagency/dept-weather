import { COLOR_SCHEME_REGEX, LocalStorageKey } from 'constants/client';
import { getLocalStorageItem } from 'hooks/use-local-storage';
import { AppTheme, ColorScheme } from 'models/color.enum';

export class AppThemeHelper {
  private static _prevIsNightVal: boolean | undefined;
  static get prevIsNightVal() {
    return this._prevIsNightVal;
  }

  private static setColorScheme(colorScheme: ColorScheme) {
    const root = document.querySelector(':root')!;
    const existingWithoutColorScheme = root.className.replaceAll(COLOR_SCHEME_REGEX, '').trim();
    root.className = `${existingWithoutColorScheme.length ? `${existingWithoutColorScheme} ` : ''}${colorScheme}`;
  }

  private static unsetColorScheme() {
    document.querySelector(':root')!.classList.remove('light', 'dark');
  }

  /** Only call from client-side
   * @requires window.localStorage  */
  static updateColorScheme(isNight?: boolean | null) {
    const appTheme = getLocalStorageItem<AppTheme>(LocalStorageKey.APP_THEME);
    switch (appTheme) {
      case 'light':
      case 'dark':
        this.setColorScheme(appTheme);
        break;
      case 'auto':
        if (isNight != null) this.setColorScheme(isNight ? 'dark' : 'light');
        break;
      default:
        this.unsetColorScheme();
        break;
    }
    if (isNight !== null) this._prevIsNightVal = isNight;
  }
}
