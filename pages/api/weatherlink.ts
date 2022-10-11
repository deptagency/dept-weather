import { NextApiRequest, NextApiResponse } from 'next';
import { default as WeatherLink } from 'weatherlink';

const apiKey = process.env.WEATHERLINK_API_KEY!;
const apiSecret = process.env.WEATHERLINK_API_SECRET!;

const weatherLink = WeatherLink({ apiKey, apiSecret });
let mainStationId: number;

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    mainStationId = mainStationId ?? (await weatherLink.getAllStations()).stations[0].station_id;
    const currentData = await weatherLink.getCurrent({ stationId: mainStationId });
    res.status(200).json(currentData);
  } catch (err) {
    res.status(500).send({ error: 'failed to fetch data' });
  }
}
