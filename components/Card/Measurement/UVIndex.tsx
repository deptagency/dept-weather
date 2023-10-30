import { Measurement } from 'components/Card/Measurement/Measurement';
import { UVIndexIcon } from 'components/Icons/UVIndexIcon';
import { EpaHourlyForecast, EpaHourlyForecastItem } from 'models/api/observations.model';
import { UVLevelName } from 'models/uv-level-name.enum';

const uvValueToLevelName = (uvValue: number | null | undefined) => {
  if (uvValue == null || uvValue < 0) return null;
  else if (uvValue <= 2) return UVLevelName.LOW;
  else if (uvValue <= 5) return UVLevelName.MODERATE;
  else if (uvValue <= 7) return UVLevelName.HIGH;
  else if (uvValue <= 10) return UVLevelName.VERY_HIGH;
  else return UVLevelName.EXTREME;
};

export function UVIndex({ epaData }: { epaData?: EpaHourlyForecast }) {
  const uvIndex = epaData?.hourlyForecast?.length
    ? epaData.hourlyForecast.reduce(
        (prev: EpaHourlyForecastItem, current: EpaHourlyForecastItem) =>
          current.time <= new Date().getTime() / 1_000 ? current : prev,
        { uvIndex: 0, time: 0 }
      )?.uvIndex
    : undefined;

  return (
    <Measurement
      icon={<UVIndexIcon uvIndex={uvIndex} />}
      label="UV Index"
      secondaryValue={uvValueToLevelName(uvIndex) ?? '–'}
      value={uvIndex ?? '–'}
    />
  );
}
