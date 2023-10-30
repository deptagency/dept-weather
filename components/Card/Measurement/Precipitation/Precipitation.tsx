import Measurement from 'components/Card/Measurement/Measurement';
import { PrecipitationIcon } from 'components/Icons';
import { toFixedOrEmDash } from 'utils';

export default function Precipitation({
  precipitation,
  label
}: {
  precipitation?: number | null | undefined;
  label: string;
}) {
  return (
    <Measurement
      icon={<PrecipitationIcon innerDropHeightPercent={0} />}
      label={label}
      value={
        <>
          {toFixedOrEmDash(precipitation)} <span>in</span>
        </>
      }
    />
  );
}
