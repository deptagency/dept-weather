import styles from './Icon.module.css';

// Source: Dept Icon Kit/SVG/48-Maps-Navigation/03-Location/location-target-1.svg
export default function LocateIcon() {
  //     className={styles['search-overlay__result__icon']}
  return (
    <svg className={styles.icon} aria-hidden="true" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 16C7.724 16 7.5 15.776 7.5 15.5V13.4773C4.84467 13.24 2.76067 11.156 2.52267 8.5H0.5C0.224 8.5 0 8.276 0 8C0 7.724 0.224 7.5 0.5 7.5H2.52267C2.76067 4.84467 4.84467 2.76067 7.5 2.52267V0.5C7.5 0.224 7.724 0 8 0C8.276 0 8.5 0.224 8.5 0.5V2.52267C11.1553 2.76067 13.2393 4.84467 13.4773 7.5H15.5C15.776 7.5 16 7.724 16 8C16 8.276 15.776 8.5 15.5 8.5H13.4773C13.24 11.1553 11.156 13.2393 8.5 13.4773V15.5C8.5 15.776 8.276 16 8 16ZM8 3.5C5.51867 3.5 3.5 5.51867 3.5 8C3.5 10.4813 5.51867 12.5 8 12.5C10.4813 12.5 12.5 10.4813 12.5 8C12.5 5.51867 10.4813 3.5 8 3.5Z" />
    </svg>
  );
}
