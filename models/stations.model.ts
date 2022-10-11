export interface Stations {
  stations: Station[];
  generated_at: number;
}

export interface Station {
  station_id: number;
  station_name: string;
  gateway_id: number;
  gateway_id_hex: string;
  product_number: string;
  username: string;
  user_email: string;
  company_name: string;
  active: boolean;
  private: boolean;
  recording_interval: number;
  firmware_version?: any;
  registered_date: number;
  time_zone: string;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number;
}
