import { Measurement } from 'components/Card/Measurement/Measurement';
import { PrecipitationIcon } from 'components/Icons/PrecipitationIcon';
import { roundTensOrEmDash } from 'utils';

export function PrecipitationForecast({
  chanceOfPrecipitation
}: {
  chanceOfPrecipitation?: number | null | undefined;
}) {
  return (
    <Measurement
      icon={<PrecipitationIcon innerDropHeightPercent={(chanceOfPrecipitation ?? 0) / 100} />}
      label="Chance of Precip"
      value={
        <>
          {roundTensOrEmDash(chanceOfPrecipitation)} <span>%</span>
        </>
      }
    />
  );
}
