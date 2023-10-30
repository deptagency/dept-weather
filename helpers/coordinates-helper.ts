import { MAX_COORDINATE_PRECISION } from 'constants/shared';
import { NumberHelper } from 'helpers/number-helper';
import { CityWithCoordinates } from 'models/cities/cities.model';

export class CoordinatesHelper {
  private static readonly LATITUDE_MIN = -90;
  private static readonly LATITUDE_MAX = 90;
  private static readonly LONGITUDE_MIN = -180;
  private static readonly LONGITUDE_MAX = 180;

  static adjustPrecision(coordinatesNumArr: number[]): number[] {
    return coordinatesNumArr.map(coordinate => NumberHelper.round(coordinate, MAX_COORDINATE_PRECISION)!);
  }
  static areValid(coordinatesNumArr: number[]): boolean {
    return (
      coordinatesNumArr?.length === 2 &&
      coordinatesNumArr[0] >= this.LATITUDE_MIN &&
      coordinatesNumArr[0] <= this.LATITUDE_MAX &&
      coordinatesNumArr[1] >= this.LONGITUDE_MIN &&
      coordinatesNumArr[1] <= this.LONGITUDE_MAX
    );
  }

  /* From string */
  static strToStrArr(coordinatesStr: string): string[] {
    return coordinatesStr.split(',');
  }
  static strToNumArr(coordinatesStr: string): number[] {
    return this.strArrToNumArr(this.strToStrArr(coordinatesStr));
  }

  /* From string array */
  static strArrToStr(coordinatesStrArr: string[]): string {
    return coordinatesStrArr.join(',');
  }
  static strArrToNumArr(coordinatesStrArr: string[]): number[] {
    return coordinatesStrArr.map(coordinate => Number(coordinate));
  }

  /* From number array */
  static numArrToStr(coordinatesNumArr: number[]): string {
    return this.strArrToStr(this.numArrToStrArr(coordinatesNumArr));
  }
  static numArrToStrArr(coordinatesNumArr: number[]): string[] {
    return coordinatesNumArr.map(coordinate => String(coordinate));
  }

  /* From City */
  static cityToStr(city: CityWithCoordinates): string {
    return this.strArrToStr(this.cityToStrArr(city));
  }
  static cityToStrArr(city: CityWithCoordinates): string[] {
    return this.numArrToStrArr(this.cityToNumArr(city));
  }
  static cityToNumArr(city: CityWithCoordinates): number[] {
    return [city.latitude, city.longitude];
  }
}
