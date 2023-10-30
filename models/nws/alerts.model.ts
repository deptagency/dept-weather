import { Geometry } from 'models/nws/geometry.model';

export interface AlertsResponse {
  features: AlertsFeature[];
  updated: string;
}

export interface AlertsFeature {
  id: string;
  geometry: Geometry | null;
  properties: AlertProperties;
}

export interface AlertProperties {
  id: string;
  areaDesc: string;
  affectedZones: string[];
  sent: string;
  effective: string;
  onset?: string;
  expires: string;
  ends?: string;
  status: AlertStatus;
  messageType: AlertMessageType;
  category: AlertCategory;
  severity: AlertSeverity;
  certainty: AlertCertainty;
  urgency: AlertUrgency;
  event: string;
  sender: string;
  senderName: string;
  headline?: string;
  description: string;
  instruction?: string;
  response: AlertResponse;
}

export enum AlertStatus {
  ACTUAL = 'Actual',
  EXERCISE = 'Exercise',
  SYSTEM = 'System',
  TEST = 'Test',
  DRAFT = 'Draft'
}

export enum AlertMessageType {
  ALERT = 'Alert',
  UPDATE = 'Update',
  CANCEL = 'Cancel',
  ACK = 'Ack',
  ERROR = 'Error'
}

export enum AlertCategory {
  MET = 'Met',
  GEO = 'Geo',
  SAFETY = 'Safety',
  SECURITY = 'Security',
  RESCUE = 'Rescue',
  FIRE = 'Fire',
  HEALTH = 'Health',
  ENV = 'Env',
  TRANSPORT = 'Transport',
  INFRA = 'Infra',
  CBRNE = 'CBRNE',
  OTHER = 'Other'
}

export enum AlertSeverity {
  EXTREME = 'Extreme',
  SEVERE = 'Severe',
  MODERATE = 'Moderate',
  MINOR = 'Minor',
  UNKNOWN = 'Unknown'
}

export enum AlertCertainty {
  OBSERVED = 'Observed',
  LIKELY = 'Likely',
  POSSIBLE = 'Possible',
  UNLIKELY = 'Unlikely',
  UNKNOWN = 'Unknown'
}

export enum AlertUrgency {
  IMMEDIATE = 'Immediate',
  EXPECTED = 'Expected',
  FUTURE = 'Future',
  PAST = 'Past',
  UNKNOWN = 'Unknown'
}

export enum AlertResponse {
  SHELTER = 'Shelter',
  EVACUATE = 'Evacuate',
  PREPARE = 'Prepare',
  EXECUTE = 'Execute',
  AVOID = 'Avoid',
  MONITOR = 'Monitor',
  ASSESS = 'Assess',
  ALL_CLEAR = 'AllClear',
  NONE = 'None'
}
