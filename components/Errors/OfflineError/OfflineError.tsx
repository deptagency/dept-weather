import { WiFiOffIcon } from 'components/Icons';
import ErrorComponent from '../ErrorComponent';

export default function OfflineError() {
  return (
    <ErrorComponent
      errorTitle="You are offline"
      errorMessage="Reconnect to the internet to check the weather"
      icon={<WiFiOffIcon></WiFiOffIcon>}
    ></ErrorComponent>
  );
}
