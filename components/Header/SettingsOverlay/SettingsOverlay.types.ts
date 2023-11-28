import { OverlayProps } from 'components/Header/Overlay/Overlay.types';
import { SearchResultCity } from 'models/cities/cities.model';

export interface SettingsOverlayProps extends Pick<OverlayProps, 'showOverlay'> {
  recentCities: SearchResultCity[];
}
