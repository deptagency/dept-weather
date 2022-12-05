import { GEOPOSITION_PERMISSION_DENIED_ERROR_CODE } from '@constants';
import { LocateOffIcon } from 'components/Icons';
import ErrorComponent from '../ErrorComponent';

export default function LocateError({ locateError }: { locateError: number | undefined }) {
  let errorTitle = 'Location Unavailable';
  let errorMessage = 'Try again later or search for a city instead';
  if (locateError === GEOPOSITION_PERMISSION_DENIED_ERROR_CODE) {
    errorTitle = 'Location Permission Denied';
    errorMessage = 'Update your browser settings or search for a city instead';
  }

  return (
    <ErrorComponent
      errorTitle={errorTitle}
      errorMessage={errorMessage}
      icon={<LocateOffIcon></LocateOffIcon>}
    ></ErrorComponent>
  );
}
