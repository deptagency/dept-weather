import { AlertDiamondIcon, ArrowIcon } from 'components/Icons';
import { useState } from 'react';
import baseStyles from '../Card.module.css';
import styles from './AlertCard.module.css';

export default function AlertCard() {
  // TODO - replace with props inputs / use real data
  const severity = 'extreme';
  const title = 'WINTER STORM WARNING';
  const expiration = 'Expires in 15m';

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <article className={baseStyles.card}>
      <button
        className={`${styles['alert-card-accordian']} ${styles[`alert-card-accordian--${severity}`]} ${
          isExpanded ? styles['alert-card-accordian--expanded'] : ''
        }`}
        onClick={e => {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }}
      >
        <div className={styles['alert-card-accordian__alert-icon']}>
          <AlertDiamondIcon useInverseFill={true}></AlertDiamondIcon>
        </div>

        <div className={`${styles['alert-card-accordian__header']}`}>
          <h2 className={styles['alert-card-accordian__header__title']}>{title}</h2>
          <p className={styles['alert-card-accordian__header__expiration']}>{expiration}</p>
        </div>
        <ArrowIcon useInverseFill={true}></ArrowIcon>
      </button>
      <div
        className={`${styles['alert-card-accordian__contents']} ${
          isExpanded
            ? styles['alert-card-accordian__contents--expanded']
            : styles['alert-card-accordian__contents--collapsed']
        }`}
      >
        <div className={baseStyles['card-contents']}>
          <p>Alert description goes here</p>
        </div>
      </div>
    </article>
  );
}
