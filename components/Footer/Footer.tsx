import homeStyles from '../../styles/Home.module.css';
import styles from './Footer.module.css';

export default function Footer() {
  return <footer className={`${styles.footer} ${homeStyles.container__content}`}>DEPT® Weather © 2022</footer>;
}
