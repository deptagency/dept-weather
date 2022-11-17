import { toFixedOrEmDash } from 'utils';
import Measurement from '../Measurement';
import { PrecipitationIcon } from './PrecipitationIcon';

export default function Precipitation({
  precipitation,
  label
}: {
  precipitation?: number | null | undefined;
  label: string;
}) {
  return (
    <Measurement
      value={
        <>
          {toFixedOrEmDash(precipitation)} <span>in</span>
        </>
      }
      label={label}
      icon={PrecipitationIcon()}
    ></Measurement>
  );
}
