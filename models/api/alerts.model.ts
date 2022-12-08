import { DataSource } from 'models';
import { AlertSeverity } from 'models/nws';
import { QueriedCityInfo } from './queried-location-info.model';
import { BaseData } from './response.model';

export interface Alerts extends QueriedCityInfo {
  [DataSource.NATIONAL_WEATHER_SERVICE]?: NwsAlerts;
}

export interface NwsAlerts extends Omit<BaseData, 'validUntil'> {
  alerts: NwsAlert[];
}

export interface NwsAlert {
  onset: number;
  onsetIsoTz: string;
  onsetLabel: string;
  onsetShortTz: string;
  expires: number;
  expiresIsoTz: string;
  expiresLabel: string;
  expiresShortTz: string;
  severity: AlertSeverity;
  senderName: string;
  title: string;
  description: DescriptionItem[];
  instruction: string[];
}

export interface DescriptionItem {
  heading?: string;
  body: string;
}
