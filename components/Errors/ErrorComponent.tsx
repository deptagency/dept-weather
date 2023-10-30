import { ReactNode } from 'react';

import styles from './ErrorComponent.module.css';

export default function ErrorComponent({
  errorTitle,
  errorMessage,
  icon
}: {
  errorTitle: string;
  errorMessage: string;
  icon: ReactNode;
}) {
  return (
    <div className={styles['error']}>
      {icon}
      <h2 className={styles['error__title']}>{errorTitle}</h2>
      <p className={styles['error__message']}>{errorMessage}</p>
    </div>
  );
}
