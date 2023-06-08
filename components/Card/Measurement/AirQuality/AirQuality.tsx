import { AirQualityIcon } from 'components/Icons';
import { AirNowObservations } from 'models/api';
import { useEffect, useState } from 'react';
import Measurement from '../Measurement';

export default function AirQuality({ airnowData }: { airnowData?: AirNowObservations }) {
  const [measurementInfo, setMeasurementInfo] = useState<{
    value: string;
    secondaryValue: string;
    label: string;
  }>({ value: '–', secondaryValue: '–', label: 'AQI' });

  useEffect(() => {
    const observation = airnowData?.observations?.length ? airnowData.observations[0] : undefined;
    setMeasurementInfo({
      value: String(observation?.aqi ?? '–'),
      secondaryValue: observation?.aqiLevelName ?? '–',
      label: `AQI${observation?.pollutant ? ` (${observation.pollutant})` : ''}`
    });
  }, [airnowData]);

  return <Measurement {...measurementInfo} icon={<AirQualityIcon></AirQualityIcon>} />;
}
