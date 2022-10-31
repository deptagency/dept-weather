import { roundOrEmDash } from '../../../../utils';
import Measurement from '../Measurement';
import { PrecipitationIcon } from './PrecipitationIcon';

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
      icon={PrecipitationIcon()}
    ></Measurement>
  );
}
