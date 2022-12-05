import { AirQualityIcon } from 'components/Icons';
import { AirNowObservations } from 'models/api';
import Measurement from '../Measurement';

export default function AirQuality({ airnowData }: { airnowData?: AirNowObservations }) {
  const observation = airnowData?.observations?.length ? airnowData.observations[0] : undefined;

  return (
    <Measurement
      value={observation?.aqi ?? '–'}
      secondaryValue={observation?.aqiLevelName ?? '–'}
      label={`Air Quality${observation?.pollutant ? ` (${observation.pollutant})` : ''}`}
      icon={<AirQualityIcon></AirQualityIcon>}
    />
  );
}
