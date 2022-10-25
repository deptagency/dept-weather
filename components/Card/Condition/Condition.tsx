import styles from './Condition.module.css';

export default function Condition({ condition }: { condition: string | null | undefined }) {
  return condition ? (
    <div className={`${styles.condition} ${styles['condition--large']}`}>
      {/* TODO - use dynamic icon based on condition / text description */}
      <img src="pcloudy.png" style={{ width: '2rem', objectFit: 'scale-down', marginRight: '0.5rem' }}></img>
      <p className={styles['condition__label']}>{condition}</p>
    </div>
  ) : (
    <></>
  );
}
