import { City, ClosestCity } from '../cities';
import { DataSource } from 'models';

export interface QueriedCityInfo {
  [DataSource.QUERIED_CITY]: City | ClosestCity;
}
