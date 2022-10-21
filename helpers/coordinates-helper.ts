import { MAX_COORDINATE_PRECISION } from '../constants';
import { Coordinates } from '../models';
import { NumberHelper } from './number-helper';

export class CoordinatesHelper {
  static normalize(inputCoordinates: Coordinates): Coordinates {
    return {
      latitude: NumberHelper.round(inputCoordinates.latitude, MAX_COORDINATE_PRECISION)!,
      longitude: NumberHelper.round(inputCoordinates.longitude, MAX_COORDINATE_PRECISION)!
    };
  }
}
