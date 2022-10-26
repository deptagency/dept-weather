import { toFixedOrEmDash } from '../../../../utils';
import Measurement from '../Measurement';

const PrecipitationIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.99945 16C6.47735 16 5.03682 15.4155 3.94386 14.355C2.82742 13.2721 2.19936 11.817 2.17589 10.2614C2.17477 10.2021 2.17477 10.1451 2.17589 10.0881C2.17589 5.72187 6.44159 0 8.00057 0C9.55844 0 13.8241 5.72411 13.8264 10.096C13.8733 13.3 11.2985 15.9508 8.08774 15.9989L7.99945 16ZM8.00057 1.7825C6.96684 2.63631 3.85222 6.65503 3.85222 10.0993C3.8511 10.1518 3.8511 10.1943 3.85222 10.2368C3.86898 11.3443 4.316 12.3802 5.1117 13.1525C5.88951 13.9079 6.92102 14.3237 8.01398 14.3237H8.06539C10.3519 14.289 12.1858 12.4004 12.1512 10.1127C12.15 6.65503 9.03431 2.63631 8.00057 1.7825Z" />
  </svg>
);

export default function Precipitation({
  precipitation,
  label
}: {
  precipitation?: number | null | undefined;
  label: string;
}) {
  return (
    <Measurement value={`${toFixedOrEmDash(precipitation)} in`} label={label} icon={PrecipitationIcon()}></Measurement>
  );
}
