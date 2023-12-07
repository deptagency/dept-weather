import { COLOR_SCHEME_REGEX, LocalStorageKey } from 'constants/client';
import { getLocalStorageItem } from 'hooks/use-local-storage';
import { AppTheme, ColorScheme } from 'models/color.enum';

export class AppThemeHelper {
  private static _prevIsNightVal: boolean | undefined;
  static get prevIsNightVal() {
    return this._prevIsNightVal;
  }

  private static readonly THEME_COLOR: Record<ColorScheme, string> = {
    light: '#fff',
    dark: '#000'
  };

  private static getThemeColorMetaSelector(prefersColorScheme?: ColorScheme) {
    return `meta[name="theme-color"]${
      prefersColorScheme ? `[media="(prefers-color-scheme: ${prefersColorScheme})"]` : ''
    }`;
  }

  private static setColorScheme(colorScheme: ColorScheme) {
    const root = document.querySelector(':root')!;
    const themeColorMetas = document.querySelectorAll(this.getThemeColorMetaSelector())!;
    const rootBaseClassName = root.className.replaceAll(COLOR_SCHEME_REGEX, '').trim();

    root.className = `${rootBaseClassName.length ? `${rootBaseClassName} ` : ''}${colorScheme}`;
    themeColorMetas.forEach(themeColorMeta => themeColorMeta.setAttribute('content', this.THEME_COLOR[colorScheme]));
  }

  private static unsetColorScheme() {
    document.querySelector(':root')!.classList.remove('light', 'dark');
    document.querySelector(this.getThemeColorMetaSelector('light'))!.setAttribute('content', this.THEME_COLOR['light']);
    document.querySelector(this.getThemeColorMetaSelector('dark'))!.setAttribute('content', this.THEME_COLOR['dark']);
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
