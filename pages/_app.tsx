import { useEffect } from 'react';
import { AppProps } from 'next/app';
import localFont from 'next/font/local';
import { AppThemeHelper } from 'helpers/app-theme';

import 'styles/globals.css';
import styles from 'styles/Home.module.css';

const maisonNeue = localFont({
  src: [
    {
      path: '../public/fonts/MaisonNeue-Light.woff2',
      weight: '300'
    },
    {
      path: '../public/fonts/MaisonNeue-Book.woff2',
      weight: '400'
    },
    {
      path: '../public/fonts/MaisonNeue-Medium.woff2',
      weight: '500'
    },
    {
      path: '../public/fonts/MaisonNeue-Bold.woff2',
      weight: '700'
    }
  ],
  fallback: ['sans-serif']
});

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => AppThemeHelper.updateColorScheme(), []);

  return (
    <div className={`${styles.container} ${maisonNeue.className}`}>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
