declare module 'weatherlink' {
  function WeatherLink(arg: Record<'apiKey' | 'apiSecret', string>): {
    getAllStations: () => Promise<import('./models/weatherlink').Stations>;
    getStations: (arg: { stationIds: number[] }) => Promise<import('./models/weatherlink').Stations>;
    getAllSensors: () => Promise<any>;
    getSensors: (arg: { sensorIds: number[] }) => Promise<any>;
    getSensorCatalog: () => Promise<any>;
    getAllSensorsWithSpecs: () => Promise<any>;
    getCurrent: (arg: { stationId: number }) => Promise<import('./models/weatherlink').CurrentConditions>;
    getHistoric: (arg: { stationId: number; startTimestamp: string; endTimestamp: string }) => Promise<any>;
  };

  export default WeatherLink;
}
