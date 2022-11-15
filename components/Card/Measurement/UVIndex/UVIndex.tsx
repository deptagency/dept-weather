import { UVLevelName } from '../../../../models';
import { EpaHourlyForecast, EpaHourlyForecastItem } from '../../../../models/api';
import Measurement from '../Measurement';

const uvValueToLevelName = (uvValue: number | null | undefined) => {
  if (uvValue == null || uvValue < 0) return null;
  else if (uvValue <= 2) return UVLevelName.LOW;
  else if (uvValue <= 5) return UVLevelName.MODERATE;
  else if (uvValue <= 7) return UVLevelName.HIGH;
  else if (uvValue <= 10) return UVLevelName.VERY_HIGH;
  else return UVLevelName.EXTREME;
};

const DEFAULT_UV_INDEX_ICON_VALUE = 5;
const UVIndexIcon = (uvValue: number) => (
  <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 16C0.672667 16 0 15.3273 0 14.5V1.5C0 0.672667 0.672667 0 1.5 0H5.5C5.776 0 6 0.224 6 0.5C6 0.776 5.776 1 5.5 1H1.5C1.224 1 1 1.224 1 1.5V14.5C1 14.776 1.224 15 1.5 15H5.5C5.776 15 6 14.776 6 14.5V11.5C6 11.224 6.224 11 6.5 11C6.776 11 7 11.224 7 11.5V14.5C7 15.3273 6.32733 16 5.5 16H1.5Z" />
    <path d="M10.5 11C7.46733 11 5 8.53267 5 5.5C5 2.46733 7.46733 0 10.5 0C13.5327 0 16 2.46733 16 5.5C16 8.53267 13.5327 11 10.5 11ZM10.5 1C8.01867 1 6 3.01867 6 5.5C6 7.98133 8.01867 10 10.5 10C12.9813 10 15 7.98133 15 5.5C15 3.01867 12.9813 1 10.5 1Z" />
    <path d="M8.5 8C7.67267 8 7 7.32733 7 6.5V4C7 3.724 7.224 3.5 7.5 3.5C7.776 3.5 8 3.724 8 4V6.5C8 6.776 8.224 7 8.5 7C8.776 7 9 6.776 9 6.5V4C9 3.724 9.224 3.5 9.5 3.5C9.776 3.5 10 3.724 10 4V6.5C10 7.32733 9.32733 8 8.5 8Z" />
    <path d="M12.5 8.00267C12.3327 8.00267 12.1767 7.91933 12.084 7.78C11.3747 6.716 11 5.478 11 4.2V4C11 3.724 11.224 3.5 11.5 3.5C11.776 3.5 12 3.724 12 4V4.2C12 4.98933 12.172 5.76933 12.5 6.482C12.828 5.76933 13 4.98933 13 4.2V4C13 3.724 13.224 3.5 13.5 3.5C13.776 3.5 14 3.724 14 4V4.2C14 5.478 13.6253 6.716 12.916 7.78C12.8233 7.91933 12.6673 8.00267 12.5 8.00267Z" />
    <path d="M2.5 14C2.224 14 2 13.776 2 13.5C2 13.224 2.224 13 2.5 13H4.5C4.776 13 5 13.224 5 13.5C5 13.776 4.776 14 4.5 14H2.5Z" />
    {uvValue > 2 ? (
      <path d="M2.5 12C2.224 12 2 11.776 2 11.5C2 11.224 2.224 11 2.5 11H4.5C4.776 11 5 11.224 5 11.5C5 11.776 4.776 12 4.5 12H2.5Z" />
    ) : (
      <></>
    )}
    {uvValue > 4 ? (
      <path d="M2.5 10C2.224 10 2 9.776 2 9.5C2 9.224 2.224 9 2.5 9H4.5C4.776 9 5 9.224 5 9.5C5 9.776 2.5 10 2.5 10Z" />
    ) : (
      <></>
    )}
    {uvValue > 6 ? (
      <path d="M2.5 8C2.224 8 2 7.776 2 7.5C2 7.224 2.224 7 2.5 7H4C4.276 7 4.5 7.224 4.5 7.5C4.5 7.776 4.276 8 4 8H2.5Z" />
    ) : (
      <></>
    )}
    {uvValue > 8 ? (
      <path d="M2.5 6C2.224 6 2 5.776 2 5.5C2 5.224 2.224 5 2.5 5H3.5C3.776 5 4 5.224 4 5.5C4 5.776 3.776 6 3.5 6H2.5Z" />
    ) : (
      <></>
    )}
    {uvValue > 10 ? (
      <path d="M2.5 4C2.224 4 2 3.776 2 3.5C2 3.224 2.224 3 2.5 3H4C4.276 3 4.5 3.224 4.5 3.5C4.5 3.776 4.276 4 4 4H2.5Z" />
    ) : (
      <></>
    )}
  </svg>
);

export default function UVIndex({ epaData }: { epaData?: EpaHourlyForecast }) {
  const uvIndex = (epaData?.hourlyForecast ?? []).reduce(
    (prev: EpaHourlyForecastItem, current: EpaHourlyForecastItem) =>
      current.time <= new Date().getTime() / 1_000 ? current : prev,
    { uvIndex: 0, time: 0 }
  )?.uvIndex;

  return (
    <Measurement
      value={uvIndex ?? '–'}
      secondaryValue={uvValueToLevelName(uvIndex) ?? '–'}
      label="UV Index"
      icon={UVIndexIcon(uvIndex ?? DEFAULT_UV_INDEX_ICON_VALUE)}
    />
  );
}
