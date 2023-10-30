import { useState } from 'react';

import styles from './Footer.module.css';
import homeStyles from 'styles/Home.module.css';

export default function Footer() {
  const [currentYear] = useState<number>(new Date().getUTCFullYear());
  return (
    <footer className={`${styles.footer} ${homeStyles.container__content}`}>DEPT® Weather © {currentYear}</footer>
  );
}
