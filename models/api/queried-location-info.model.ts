import { QueriedLocation } from '../cities';
import { DataSource } from '../data-source.enum';

export interface QueriedLocationInfo {
  [DataSource.QUERIED_LOCATION]: QueriedLocation;
}
