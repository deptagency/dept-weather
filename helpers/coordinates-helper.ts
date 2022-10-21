import { MAX_COORDINATE_PRECISION } from '../constants';
import { NumberHelper } from './number-helper';

export class CoordinatesHelper {
  static adjustPrecision(coordinatesStr: string): string {
    return this.numArrToStr(
      this.strToNumArr(coordinatesStr).map(
        inputCoordinate => NumberHelper.round(inputCoordinate, MAX_COORDINATE_PRECISION)!
      )
    );
  }

  static strToArr(coordinatesStr: string): string[] {
    return coordinatesStr.split(',');
  }

  static strToNumArr(coordinatesStr: string): number[] {
    return this.strToArr(coordinatesStr).map(coordinate => Number(coordinate));
  }

  static arrToStr(coordinatesArr: string[]): string {
    return coordinatesArr.join(',');
  }

  static numArrToStr(coordinatesArr: number[]): string {
    return this.arrToStr(coordinatesArr.map(coordinate => String(coordinate)));
  }
}
