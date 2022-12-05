import { PrecipitationIcon } from 'components/Icons';
import { toFixedOrEmDash } from 'utils';
import Measurement from '../Measurement';

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
      icon={<PrecipitationIcon innerDropHeightPercent={0}></PrecipitationIcon>}
    ></Measurement>
  );
}
