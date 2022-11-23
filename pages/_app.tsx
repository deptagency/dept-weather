import localFont from '@next/font/local';
import App, { AppContext, AppProps } from 'next/app';
import styles from 'styles/Home.module.css';
import '../styles/globals.css';

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
      path: '../public/fonts/MaisonNeue-Bold.woff2',
      weight: '700'
    }
  ],
  fallback: ['sans-serif']
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={`${styles.container} ${maisonNeue.className}`}>
      <Component {...pageProps} />
    </div>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);

  if (appContext.ctx.res?.statusCode === 404) {
    appContext.ctx.res.writeHead(302, { Location: '/' });
    appContext.ctx.res.end();
    return;
  }

  return { ...appProps };
};

export default MyApp;
