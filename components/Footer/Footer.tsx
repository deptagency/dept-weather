import { useState } from 'react';
import homeStyles from 'styles/Home.module.css';
import styles from './Footer.module.css';

export default function Footer() {
  const [currentYear] = useState<number>(new Date().getUTCFullYear());
  return <footer className={`${styles.footer} ${homeStyles.container__content}`}>DEPT® Weather © {currentYear}</footer>;
}
