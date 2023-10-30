import { Measurement } from 'components/Card/Measurement/Measurement';
import { HumidityIcon } from 'components/Icons/HumidityIcon';
import { roundOrEmDash } from 'utils';

export function Humidity({ humidity }: { humidity?: number | null | undefined }) {
  return (
    <Measurement
      icon={<HumidityIcon />}
      label="Humidity"
      value={
        <>
          {roundOrEmDash(humidity)} <span>%</span>
        </>
      }
    />
  );
}
