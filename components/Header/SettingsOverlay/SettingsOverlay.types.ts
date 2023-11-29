import { OverlayProps } from 'components/Header/Overlay/Overlay.types';
import { SearchResultCity } from 'models/cities/cities.model';
import { UnitChoices } from 'models/unit.enum';

export interface SettingsOverlayProps extends Pick<OverlayProps, 'showOverlay'> {
  recentCities: SearchResultCity[];
}

export interface SettingsInputs {
  theme: 'auto' | 'system' | 'light' | 'dark';
  units: UnitChoices;
}
