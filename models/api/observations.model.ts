export interface Observations {
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  wind: Wind;
  pressure: Pressure;
}

export interface Wind {
  speed: number | null;
  direction: number | null;
  gustSpeed: number | null;
}

export interface Pressure {
  atSeaLevel: number | null;
  trend: number | null;
}
