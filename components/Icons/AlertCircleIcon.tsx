import styles from './Icon.module.css';

// Source: Dept Icon Kit/SVG/01-Interface Essential/14-Alerts/alert-circle.svg
export function AlertCircleIcon({ useInverseFill }: { useInverseFill?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`${styles.icon} ${useInverseFill ? styles['icon--inverse-fill'] : ''}`}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 12C8.41421 12 8.75 11.6642 8.75 11.25C8.75 10.8358 8.41421 10.5 8 10.5C7.58579 10.5 7.25 10.8358 7.25 11.25C7.25 11.6642 7.58579 12 8 12Z" />
      <path d="M8 9.5C7.724 9.5 7.5 9.276 7.5 9V3.5C7.5 3.224 7.724 3 8 3C8.276 3 8.5 3.224 8.5 3.5V9C8.5 9.276 8.276 9.5 8 9.5Z" />
      <path d="M8 16C3.58867 16 0 12.4113 0 8C0 3.58867 3.58867 0 8 0C12.4113 0 16 3.58867 16 8C16 12.4113 12.4113 16 8 16ZM8 1C4.14 1 1 4.14 1 8C1 11.86 4.14 15 8 15C11.86 15 15 11.86 15 8C15 4.14 11.86 1 8 1Z" />
    </svg>
  );
}
