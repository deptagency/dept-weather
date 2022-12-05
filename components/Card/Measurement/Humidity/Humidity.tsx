import { HumidityIcon } from 'components/Icons';
import { roundOrEmDash } from 'utils';
import Measurement from '../Measurement';

export default function Humidity({ humidity }: { humidity?: number | null | undefined }) {
  return (
    <Measurement
      value={
        <>
          {roundOrEmDash(humidity)} <span>%</span>
        </>
      }
      label="Humidity"
      icon={<HumidityIcon></HumidityIcon>}
    ></Measurement>
  );
}
