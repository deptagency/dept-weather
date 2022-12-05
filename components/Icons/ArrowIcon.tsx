import styles from './Icon.module.css';

// Source: Dept Icon Kit/SVG/52-Arrows-Diagrams/01-Arrows/arrow-down-1.svg
export default function ArrowIcon({ useInverseFill }: { useInverseFill?: boolean }) {
  return (
    <svg
      className={`${styles.icon} ${useInverseFill ? styles['icon--inverse-fill'] : ''}`}
      aria-hidden="true"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 12.666C7.73333 12.666 7.48267 12.562 7.294 12.374L0.146667 5.22733C0.052 5.13266 0 5.00733 0 4.87333C0 4.74 0.052 4.614 0.146667 4.52C0.241333 4.42533 0.366667 4.37333 0.5 4.37333C0.633333 4.37333 0.759333 4.42533 0.853333 4.52L8 11.666L15.1467 4.52C15.2413 4.42533 15.3667 4.37333 15.5 4.37333C15.6333 4.37333 15.7593 4.42533 15.8533 4.52C15.948 4.61466 16 4.74 16 4.87333C16 5.00666 15.948 5.13266 15.8533 5.22666L8.70667 12.3733C8.51867 12.562 8.26733 12.666 8 12.666Z" />
    </svg>
  );
}
