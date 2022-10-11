import styles from './Reading.module.css';

export default function Wind({
  children,
  title,
  value
}: {
  children?: React.ReactNode;
  title: string;
  value?: string;
}) {
  return (
    <div className={styles.reading}>
      <h3 className={styles.heading}>{title}</h3>
      {value ? <p className={styles.value}>{value}</p> : <></>}
      {children}
    </div>
  );
}
