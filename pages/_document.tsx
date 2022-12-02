import { APP_DESCRIPTION, APP_MASK_ICON_COLOR, APP_THEME_COLOR, APP_TITLE, APP_URL } from '@constants';
import { Html, Head, Main, NextScript } from 'next/document';

const AppleSplashLink = ({
  width,
  height,
  ratio,
  isDark
}: {
  width: number;
  height: number;
  ratio: number;
  isDark: boolean;
}) => (
  <link
    rel="apple-touch-startup-image"
    href={`/splash-screens/apple-splash${isDark ? '-dark' : ''}-${width}x${height}.png`}
    media={`${isDark ? '(prefers-color-scheme: dark) and ' : ''}(device-width: ${
      width / ratio
    }px) and (device-height: ${height / ratio}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: ${
      width > height ? 'landscape' : 'portrait'
    })`}
  />
);

const AppleSplash = ({ width, height, ratio }: { width: number; height: number; ratio: number }) => (
  <>
    <AppleSplashLink width={width} height={height} ratio={ratio} isDark={false}></AppleSplashLink>
    <AppleSplashLink width={width} height={height} ratio={ratio} isDark={true}></AppleSplashLink>
  </>
);

const APPLE_SPLASH_SIZES = [
  { width: 1290, height: 2796, ratio: 3 },
  { width: 1284, height: 2778, ratio: 3 },
  { width: 1242, height: 2688, ratio: 3 },
  { width: 1242, height: 2208, ratio: 3 },
  { width: 1179, height: 2556, ratio: 3 },
  { width: 1170, height: 2532, ratio: 3 },
  { width: 1125, height: 2436, ratio: 3 },
  { width: 1080, height: 2340, ratio: 3 },
  { width: 750, height: 1334, ratio: 2 },
  { width: 640, height: 1096, ratio: 2 }
];

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="application-name" content={APP_TITLE} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_TITLE} />
        <meta name="description" content={APP_DESCRIPTION} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content={APP_THEME_COLOR} />

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="mask-icon" href="/favicon.svg" color={APP_MASK_ICON_COLOR} />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />

        <meta name="msapplication-square70x70logo" content="/icons/msapplication-128.png" />
        <meta name="msapplication-square150x150logo" content="/icons/msapplication-270.png" />
        <meta name="msapplication-square310x310logo" content="/icons/msapplication-558.png" />
        <meta name="msapplication-wide310x150logo" content="/icons/msapplication-558x270.png" />

        <meta name="twitter:card" content="app" />
        <meta name="twitter:title" content={APP_TITLE} />
        <meta name="twitter:description" content={APP_DESCRIPTION} />
        <meta name="twitter:site" content="@DeptAgency" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={APP_TITLE} />
        <meta property="og:title" content={APP_TITLE} />
        <meta property="og:description" content={APP_DESCRIPTION} />
        <meta property="og:url" content={APP_URL} />
        <meta property="og:image" content={`${APP_URL}/icons/apple-touch-icon.png`} />

        {APPLE_SPLASH_SIZES.map((splashSize, i) => (
          <AppleSplash key={i} {...splashSize}></AppleSplash>
        ))}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
