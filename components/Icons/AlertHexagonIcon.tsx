import { iconStyle, WithCustomizableFillColor } from 'components/Icons/iconStyle';

import styles from './Icon.module.css';

// Designed in Figma
export function AlertHexagonIcon({ fillColor }: WithCustomizableFillColor) {
  return (
    <svg
      aria-hidden="true"
      className={`${styles.icon} ${styles['icon--custom-fill']}`}
      style={iconStyle(fillColor)}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 11.9987C8.41421 11.9987 8.75 11.6629 8.75 11.2487C8.75 10.8345 8.41421 10.4987 8 10.4987C7.58579 10.4987 7.25 10.8345 7.25 11.2487C7.25 11.6629 7.58579 11.9987 8 11.9987Z" />
      <path d="M8 9.49867C7.724 9.49867 7.5 9.27467 7.5 8.99867V3.99867C7.5 3.72267 7.724 3.49867 8 3.49867C8.276 3.49867 8.5 3.72267 8.5 3.99867V8.99867C8.5 9.27467 8.27533 9.49867 8 9.49867Z" />
      <path
        className={styles['icon__path--stroke']}
        d="M7.37507 0.670856C7.76182 0.447565 8.23832 0.447565 8.62507 0.670856L14.0348 3.79417C14.4216 4.01746 14.6598 4.43012 14.6598 4.8767V11.1233C14.6598 11.5699 14.4216 11.9826 14.0348 12.2059L8.62507 15.3292C8.23832 15.5525 7.76182 15.5525 7.37507 15.3292L1.96533 12.2059C1.57858 11.9826 1.34033 11.5699 1.34033 11.1233V4.8767C1.34033 4.43012 1.57858 4.01746 1.96533 3.79417L7.37507 0.670856Z"
      />
    </svg>
  );
}
