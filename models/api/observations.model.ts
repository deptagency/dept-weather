export interface Observations {
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  wind: Wind;
}

export interface Wind {
  speed: number | null;
  direction: number | null;
  gustSpeed: number | null;
}
