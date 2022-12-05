import { PrecipitationIcon } from 'components/Icons';
import { roundOrEmDash } from 'utils';
import Measurement from '../Measurement';

export default function PrecipitationForecast({
  chanceOfPrecipitation
}: {
  chanceOfPrecipitation?: number | null | undefined;
}) {
  return (
    <Measurement
      value={
        <>
          {roundOrEmDash(chanceOfPrecipitation)} <span>%</span>
        </>
      }
      label="Chance of Precip"
      icon={<PrecipitationIcon innerDropHeightPercent={(chanceOfPrecipitation ?? 0) / 100}></PrecipitationIcon>}
    ></Measurement>
  );
}
