import styles from './Icon.module.css';
import windIconStyles from './WindIcon.module.css';

// Source (adaptation of): Dept Icon Kit/SVG/34-Weather/09-Wind/wind-north.svg
export function WindIcon({ directionDeg, ariaLabel }: { directionDeg: number | null | undefined; ariaLabel?: string }) {
  const rotateDeg = directionDeg != null ? (directionDeg < 180 ? directionDeg + 180 : directionDeg - 180) : 0;
  return (
    <svg
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      className={styles.icon}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className={windIconStyles['icon__wind-arrow']}
        d="M6.99938 9.99867C6.88338 9.99867 6.77004 9.958 6.68071 9.884C6.51738 9.74867 6.45671 9.52467 6.52938 9.326L9.02938 2.508C9.10138 2.312 9.29004 2.18 9.49871 2.18C9.70738 2.18 9.89604 2.312 9.96804 2.508L12.468 9.326C12.5407 9.52467 12.48 9.74867 12.3174 9.88333C12.228 9.95733 12.1147 9.998 11.9987 9.998C11.908 9.998 11.8187 9.97333 11.7414 9.92667L9.49871 8.58133L7.25604 9.92733C7.17871 9.974 7.09004 9.99867 6.99938 9.99867ZM7.95604 8.34133L9.24204 7.57C9.31938 7.52333 9.40871 7.49867 9.49938 7.49867C9.59004 7.49867 9.67938 7.52333 9.75671 7.57L11.042 8.34133L9.49871 4.13267L7.95604 8.34133Z"
        style={{ transform: `rotate(${rotateDeg}deg)` }}
      />
      <path d="M6.99866 15.9987C6.72266 15.9987 6.49866 15.7747 6.49866 15.4987C6.49866 15.2227 6.72266 14.9987 6.99866 14.9987H7.49866C7.77466 14.9987 7.99866 14.7747 7.99866 14.4987C7.99866 14.2227 7.77399 13.9987 7.49866 13.9987H0.498657C0.222657 13.9987 -0.00134277 13.7747 -0.00134277 13.4987C-0.00134277 13.2227 0.222657 12.9987 0.498657 12.9987H7.49866C8.32599 12.9987 8.99866 13.6713 8.99866 14.4987C8.99866 15.326 8.32532 15.9987 7.49866 15.9987H6.99866Z" />
      <path d="M0.498657 11.9987C0.222657 11.9987 -0.00134277 11.7747 -0.00134277 11.4987C-0.00134277 11.2227 0.222657 10.9987 0.498657 10.9987H3.99866C4.27466 10.9987 4.49866 10.7747 4.49866 10.4987C4.49866 10.2227 4.27466 9.99867 3.99866 9.99867H3.49866C3.22266 9.99867 2.99866 9.77467 2.99866 9.49867C2.99866 9.22267 3.22266 8.99867 3.49866 8.99867H3.99866C4.82599 8.99867 5.49866 9.67134 5.49866 10.4987C5.49866 11.326 4.82599 11.9987 3.99866 11.9987H0.498657Z" />
      <path d="M11.0506 12.796C10.8246 12.796 10.6259 12.6433 10.5679 12.4253C10.4966 12.1593 10.6553 11.8847 10.9219 11.8133C13.8513 11.0287 15.5966 8.00733 14.8119 5.078C14.4319 3.65867 13.5219 2.47267 12.2499 1.738C11.4119 1.254 10.4639 0.998668 9.5086 0.998668C9.0286 0.998668 8.5466 1.06267 8.0766 1.188C5.6766 1.83067 3.99993 4.01467 3.99927 6.49933C3.99927 6.81467 4.02593 7.13133 4.07927 7.442C4.10193 7.57333 4.07193 7.706 3.9946 7.81533C3.91727 7.92467 3.8026 7.99667 3.67127 8.01934C3.64327 8.024 3.6146 8.02667 3.5866 8.02667C3.3426 8.02667 3.13527 7.852 3.09393 7.61133C3.03127 7.24533 2.99927 6.87067 2.99927 6.49933C2.99993 3.56333 4.98127 0.982001 7.81793 0.222001C8.37327 0.0733344 8.94193 -0.0019989 9.50993 -0.0019989C10.6399 -0.0019989 11.7606 0.300001 12.7506 0.872001C14.2539 1.74067 15.3293 3.142 15.7786 4.81933C16.7053 8.28133 14.6433 11.8527 11.1813 12.7793C11.1366 12.79 11.0939 12.796 11.0506 12.796Z" />
    </svg>
  );
}
