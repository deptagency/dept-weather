import { AlertDiamondIcon, ArrowIcon } from 'components/Icons';
import baseStyles from '../Card.module.css';
import styles from './AlertCard.module.css';

export default function AlertCard() {
  // TODO - replace with props inputs / use real data
  const severity = 'extreme';
  const title = 'WINTER STORM WARNING';
  const expiration = 'Expires in 15m';
  return (
    <article className={baseStyles.card}>
      <button className={`${styles['alert-card-accordian']} ${styles[`alert-card-accordian--${severity}`]}`}>
        <div className={styles['alert-card-accordian__alert-icon']}>
          <AlertDiamondIcon useInverseFill={true}></AlertDiamondIcon>
        </div>

        <div className={`${styles['alert-card-accordian__header']}`}>
          <h2 className={styles['alert-card-accordian__header__title']}>{title}</h2>
          <p className={styles['alert-card-accordian__header__expiration']}>{expiration}</p>
        </div>
        <ArrowIcon useInverseFill={true}></ArrowIcon>
      </button>
    </article>
  );
}
