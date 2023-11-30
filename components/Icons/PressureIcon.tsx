import { PressureLevelDescription, PressureTrendDescription } from 'models/api/observations.model';

import styles from './Icon.module.css';

// Source (adaptation of): Dept Icon Kit/SVG/34-Weather/07-UV/uv-high.svg
export function PressureIcon({
  level,
  trend
}: {
  level: PressureLevelDescription | null | undefined;
  trend: PressureTrendDescription | null | undefined;
}) {
  return (
    <svg aria-hidden="true" className={styles.icon} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 16C0.672667 16 0 15.3273 0 14.5V1.5C0 0.672667 0.672667 0 1.5 0H5.5C5.776 0 6 0.224 6 0.5C6 0.776 5.776 1 5.5 1H1.5C1.224 1 1 1.224 1 1.5V14.5C1 14.776 1.224 15 1.5 15H5.5C5.776 15 6 14.776 6 14.5V11.5C6 11.224 6.224 11 6.5 11C6.776 11 7 11.224 7 11.5V14.5C7 15.3273 6.32733 16 5.5 16H1.5Z" />
      {level === 'low' ? (
        <path d="M3.5 14C2.67267 14 2 13.3273 2 12.5C2 11.86 2.41 11.2947 3 11.086V10C3 9.724 3.224 9.5 3.5 9.5C3.776 9.5 4 9.724 4 10V11.086C4.59 11.2947 5 11.86 5 12.5C5 13.3273 4.32733 14 3.5 14ZM3.5 12C3.224 12 3 12.224 3 12.5C3 12.776 3.224 13 3.5 13C3.776 13 4 12.776 4 12.5C4 12.224 3.776 12 3.5 12Z" />
      ) : (
        <></>
      )}
      {level === 'medium' || level == null ? (
        <path d="M3.5 14C2.67267 14 2 13.3273 2 12.5C2 11.86 2.41 11.2947 3 11.086V7C3 6.724 3.224 6.5 3.5 6.5C3.776 6.5 4 6.724 4 7V11.086C4.59 11.2947 5 11.86 5 12.5C5 13.3273 4.32733 14 3.5 14ZM3.5 12C3.224 12 3 12.224 3 12.5C3 12.776 3.224 13 3.5 13C3.776 13 4 12.776 4 12.5C4 12.224 3.776 12 3.5 12Z" />
      ) : (
        <></>
      )}
      {level === 'high' ? (
        <path d="M3.5 14C2.67267 14 2 13.3273 2 12.5C2 11.86 2.41 11.2947 3 11.086V3.5C3 3.224 3.224 3 3.5 3C3.776 3 4 3.224 4 3.5V11.086C4.59 11.2947 5 11.86 5 12.5C5 13.3273 4.32733 14 3.5 14ZM3.5 12C3.224 12 3 12.224 3 12.5C3 12.776 3.224 13 3.5 13C3.776 13 4 12.776 4 12.5C4 12.224 3.776 12 3.5 12Z" />
      ) : (
        <></>
      )}
      <path d="M10.5 11C7.46733 11 5 8.53267 5 5.5C5 2.46733 7.46733 0 10.5 0C13.5327 0 16 2.46733 16 5.5C16 8.53267 13.5327 11 10.5 11ZM10.5 1C8.01867 1 6 3.01867 6 5.5C6 7.98133 8.01867 10 10.5 10C12.9813 10 15 7.98133 15 5.5C15 3.01867 12.9813 1 10.5 1Z" />
      {trend === 'decreasing' ? (
        <path d="M10.5004 8.5C10.4263 8.5 10.3538 8.4872 10.283 8.4616C10.2738 8.4584 10.2646 8.4552 10.2563 8.452C10.1855 8.424 10.1171 8.38 10.058 8.324L8.1833 6.524C8.06499 6.4112 8 6.26 8 6.1C8 5.94 8.06499 5.7888 8.1833 5.676C8.30162 5.5632 8.45909 5.5 8.62573 5.5C8.79237 5.5 8.94984 5.5624 9.06732 5.676L9.87552 6.452V3.1C9.87552 2.7696 10.1555 2.5 10.5004 2.5C10.8454 2.5 11.1253 2.7696 11.1253 3.1V6.452L11.9335 5.676C12.0518 5.5624 12.2085 5.5 12.3751 5.5C12.5417 5.5 12.6992 5.5624 12.8167 5.676C12.935 5.7888 13 5.94 13 6.1C13 6.26 12.935 6.4112 12.8167 6.524L10.942 8.324C10.8837 8.38 10.8145 8.424 10.7379 8.4544C10.732 8.4568 10.7245 8.4592 10.7179 8.4616C10.6504 8.4864 10.5762 8.5 10.5004 8.5Z" />
      ) : (
        <></>
      )}
      {trend === 'stable' ? (
        <path d="M13.5 5.49958C13.5 5.57374 13.4872 5.64623 13.4616 5.71705C13.4584 5.72621 13.4552 5.73538 13.452 5.74371C13.424 5.81453 13.38 5.88285 13.324 5.94201L11.524 7.8167C11.4112 7.93501 11.26 8 11.1 8C10.94 8 10.7888 7.93501 10.676 7.8167C10.5632 7.69838 10.5 7.54091 10.5 7.37427C10.5 7.20763 10.5624 7.05016 10.676 6.93268L11.452 6.12448H8.1C7.7696 6.12448 7.5 5.84453 7.5 5.49958C7.5 5.15464 7.7696 4.87469 8.1 4.87469H11.452L10.676 4.06649C10.5624 3.94818 10.5 3.79153 10.5 3.6249C10.5 3.45826 10.5624 3.30078 10.676 3.1833C10.7888 3.06499 10.94 3 11.1 3C11.26 3 11.4112 3.06499 11.524 3.1833L13.324 5.05799C13.38 5.11631 13.424 5.18547 13.4544 5.26212C13.4568 5.26796 13.4592 5.27545 13.4616 5.28212C13.4864 5.34961 13.5 5.42376 13.5 5.49958Z" />
      ) : (
        <></>
      )}
      {trend == null ? <rect height="1.25" rx="0.625" width="6" x="7.5" y="4.875" /> : <></>}
      {trend === 'increasing' ? (
        <path d="M10.4996 2.5C10.5737 2.5 10.6462 2.5128 10.717 2.5384C10.7262 2.5416 10.7354 2.5448 10.7437 2.548C10.8145 2.576 10.8829 2.62 10.942 2.676L12.8167 4.476C12.935 4.5888 13 4.74 13 4.9C13 5.06 12.935 5.2112 12.8167 5.324C12.6984 5.4368 12.5409 5.5 12.3743 5.5C12.2076 5.5 12.0502 5.4376 11.9327 5.324L11.1245 4.548V7.9C11.1245 8.2304 10.8445 8.5 10.4996 8.5C10.1546 8.5 9.87469 8.2304 9.87469 7.9V4.548L9.06649 5.324C8.94818 5.4376 8.79153 5.5 8.6249 5.5C8.45826 5.5 8.30078 5.4376 8.1833 5.324C8.06499 5.2112 8 5.06 8 4.9C8 4.74 8.06499 4.5888 8.1833 4.476L10.058 2.676C10.1163 2.62 10.1855 2.576 10.2621 2.5456C10.268 2.5432 10.2755 2.5408 10.2821 2.5384C10.3496 2.5136 10.4238 2.5 10.4996 2.5Z" />
      ) : (
        <></>
      )}
    </svg>
  );
}
