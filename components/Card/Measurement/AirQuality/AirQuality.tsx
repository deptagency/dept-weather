import { AirQualityIcon } from 'components/Icons';
import { AirNowObservations } from 'models/api';
import { useEffect, useState } from 'react';
import Measurement from '../Measurement';

export default function AirQuality({ airnowData }: { airnowData?: AirNowObservations }) {
  const [value, setValue] = useState<string>('–');
  const [secondaryValue, setSecondaryValue] = useState<string>('–');

  useEffect(() => {
    const observation = airnowData?.observations?.length ? airnowData.observations[0] : undefined;

    const newValue = String(observation?.aqi ?? '–');

    let _newSecondaryValue: string | undefined = observation?.aqiLevelName ?? undefined;
    if (observation?.pollutant) {
      if (_newSecondaryValue != null) _newSecondaryValue += ` (${observation.pollutant})`;
      else _newSecondaryValue = observation.pollutant;
    }
    const newSecondaryValue = _newSecondaryValue ?? '–';

    setValue(newValue);
    setSecondaryValue(newSecondaryValue);
  }, [airnowData]);

  return (
    <Measurement
      value={value}
      secondaryValue={secondaryValue}
      label="Air Quality"
      icon={<AirQualityIcon></AirQualityIcon>}
    />
  );
}
