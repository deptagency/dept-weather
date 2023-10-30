import Measurement from 'components/Card/Measurement/Measurement';
import { PrecipitationIcon } from 'components/Icons';
import { roundTensOrEmDash } from 'utils';

export default function PrecipitationForecast({
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
