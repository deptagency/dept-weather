import { Measurement } from 'components/Card/Measurement/Measurement';
import { PrecipitationIcon } from 'components/Icons/PrecipitationIcon';
import { toFixedOrEmDash } from 'utils';

export function Precipitation({ precipitation, label }: { precipitation?: number | null | undefined; label: string }) {
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
