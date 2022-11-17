import { QueriedLocation } from '../cities';
import { DataSource } from 'models';

export interface QueriedLocationInfo {
  [DataSource.QUERIED_LOCATION]: QueriedLocation;
}
