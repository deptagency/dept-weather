import { OverlayProps } from 'components/Header/Overlay/Overlay.types';
import { LocalStorageKey } from 'constants/client';
import { SearchResultCity } from 'models/cities/cities.model';
import { AppTheme } from 'models/color.enum';
import { UnitChoices } from 'models/unit.enum';

export interface SettingsOverlayProps extends Pick<OverlayProps, 'showOverlay'> {
  recentCities: SearchResultCity[];
}

export interface SettingsInputs {
  [LocalStorageKey.APP_THEME]: AppTheme;
  [LocalStorageKey.UNITS]: UnitChoices;
}
