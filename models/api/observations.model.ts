export interface Observations {
  temperature: number;
  feelsLike: number;
  humidity: number;
  wind: Wind;
}

export interface Wind {
  speed: number;
  direction: number;
  gustSpeed: number;
}
