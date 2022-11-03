import homeStyles from '../../styles/Home.module.css';
import styles from './Header.module.css';

const DEPTLogo = () => (
  <svg
    aria-label="DEPT®"
    className={styles.header__branding__logo}
    viewBox="0 0 10688 3035"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2726.46 1485.34C2726.46 732.215 2315.32 152 1270.16 152H152V2818.68H1270.16C2315.32 2818.68 2726.46 2238.47 2726.46 1485.34ZM1965.65 1485.34C1965.65 2011.76 1669.78 2207.73 1258.64 2207.73H878.229V762.955H1258.64C1669.78 762.955 1965.65 958.921 1965.65 1485.34Z" />
    <path d="M2900.38 2818.68H5013.74V2211.57H3626.61V1754.32H4844.67V1177.94H3626.61V759.112H4979.16V152H2900.38V2818.68Z" />
    <path d="M7473.88 1078.04C7473.88 405.604 7043.52 152 6374.93 152H5218.34V2818.68H5944.57V2004.08H6374.93C7043.52 2004.08 7473.88 1750.47 7473.88 1078.04ZM6720.76 1078.04C6720.76 1339.33 6597.8 1446.92 6301.92 1446.92H5944.57V709.16H6301.92C6597.8 709.16 6720.76 816.749 6720.76 1078.04Z" />
    <path d="M7553.13 774.482H8394.63V2818.68H9120.86V774.482H9962.36V152H7553.13V774.482Z" />
    <path d="M9660.6 2445.33C9660.6 2686.65 9855.95 2882 10097.3 2882C10338.6 2882 10535.9 2686.65 10535.9 2445.33C10535.9 2204.01 10338.6 2006.74 10097.3 2006.74C9855.95 2006.74 9660.6 2204.01 9660.6 2445.33ZM9744.87 2445.33C9744.87 2246.15 9901.91 2083.35 10097.3 2083.35C10292.6 2083.35 10451.6 2246.15 10451.6 2445.33C10451.6 2644.51 10292.6 2805.39 10097.3 2805.39C9901.91 2805.39 9744.87 2644.51 9744.87 2445.33ZM9892.34 2661.75H10030.2V2512.36H10108.8L10191.1 2661.75H10340.5L10240.9 2485.55C10286.9 2466.4 10321.3 2414.69 10321.3 2357.23C10321.3 2255.72 10256.2 2207.84 10145.1 2207.84H9892.34V2661.75ZM10181.5 2359.14C10181.5 2395.53 10158.6 2410.86 10114.5 2410.86H10030.2V2315.09H10114.5C10158.6 2315.09 10181.5 2326.59 10181.5 2359.14Z" />
  </svg>
);

const ArrowIcon = ({ ariaLabel }: { ariaLabel?: string }) => (
  <svg
    aria-label={ariaLabel}
    className={styles.header__location__arrow}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 18.999C11.6 18.999 11.224 18.843 10.941 18.561L0.22 7.841C0.078 7.699 0 7.511 0 7.31C0 7.11 0.078 6.921 0.22 6.78C0.362 6.638 0.55 6.56 0.75 6.56C0.95 6.56 1.139 6.638 1.28 6.78L12 17.499L22.72 6.78C22.862 6.638 23.05 6.56 23.25 6.56C23.45 6.56 23.639 6.638 23.78 6.78C23.922 6.922 24 7.11 24 7.31C24 7.51 23.922 7.699 23.78 7.84L13.06 18.56C12.778 18.843 12.401 18.999 12 18.999Z" />
  </svg>
);

export default function Header({
  onInputFocusChange,
  onSearchQueryChange
}: {
  onInputFocusChange: (isFocused: boolean) => void;
  onSearchQueryChange: (query: string) => void;
}) {
  return (
    <div className={styles.header__container}>
      <header className={`${styles.header} ${homeStyles.container__content}`}>
        <h1 className={styles.header__branding}>
          <DEPTLogo></DEPTLogo>
          <span className={`${styles.header__text} ${styles.header__branding__text}`}>Weather</span>
        </h1>
        <button className={styles.header__location}>
          <input
            className={`${styles.header__text} ${styles.header__location__input}`}
            type="text"
            onChange={e => onSearchQueryChange(e.target.value)}
            onFocus={() => onInputFocusChange(true)}
            onBlur={() => onInputFocusChange(false)}
          ></input>
          <ArrowIcon></ArrowIcon>
        </button>
      </header>
    </div>
  );
}
