import { DetailedWindDirection } from 'models/detailed-wind-direction.enum';
import { WindDirection } from 'models/wind-direction.enum';

export class WindHelper {
  static degToDir(deg: number) {
    if (deg > 337.5 || deg <= 22.5) return WindDirection.N;
    else if (deg <= 67.5) return WindDirection.NE;
    else if (deg <= 112.5) return WindDirection.E;
    else if (deg <= 157.5) return WindDirection.SE;
    else if (deg <= 202.5) return WindDirection.S;
    else if (deg <= 247.5) return WindDirection.SW;
    else if (deg <= 292.5) return WindDirection.W;
    else if (deg <= 337.5) return WindDirection.NW;

    return '';
  }

  static dirToDeg(dir?: WindDirection | DetailedWindDirection | null) {
    if (dir === WindDirection.N) return 0;
    else if (dir === DetailedWindDirection.NNE) return 22.5;
    else if (dir === WindDirection.NE) return 45;
    else if (dir === DetailedWindDirection.ENE) return 67.5;
    else if (dir === WindDirection.E) return 90;
    else if (dir === DetailedWindDirection.ESE) return 112.5;
    else if (dir === WindDirection.SE) return 135;
    else if (dir === DetailedWindDirection.SSE) return 157.5;
    else if (dir === WindDirection.S) return 180;
    else if (dir === DetailedWindDirection.SSW) return 202.5;
    else if (dir === WindDirection.SW) return 225;
    else if (dir === DetailedWindDirection.WSW) return 247.5;
    else if (dir === WindDirection.W) return 270;
    else if (dir === DetailedWindDirection.WNW) return 292.5;
    else if (dir === WindDirection.NW) return 315;
    else if (dir === DetailedWindDirection.NNW) return 337.5;

    return null;
  }
}
