import { City, ClosestCity } from 'models/cities/cities.model';
import { DataSource } from 'models/data-source.enum';

export interface QueriedCityInfo {
  [DataSource.QUERIED_CITY]: City | ClosestCity;
}
