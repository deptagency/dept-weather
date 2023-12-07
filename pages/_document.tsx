import { Head, Html, Main, NextScript } from 'next/document';
import { APP_DESCRIPTION, APP_MASK_ICON_COLOR, APP_TITLE, APP_URL } from 'constants/client';

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
    href={`/splash-screens/apple-splash${isDark ? '-dark' : ''}-${width}x${height}.png`}
    media={`${isDark ? '(prefers-color-scheme: dark) and ' : ''}(device-width: ${
      width / ratio
    }px) and (device-height: ${height / ratio}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: ${
      width > height ? 'landscape' : 'portrait'
    })`}
    rel="apple-touch-startup-image"
  />
);

const AppleSplash = ({ width, height, ratio }: { width: number; height: number; ratio: number }) => (
  <>
    <AppleSplashLink height={height} isDark={false} ratio={ratio} width={width} />
    <AppleSplashLink height={height} isDark={true} ratio={ratio} width={width} />
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
        <meta content={APP_TITLE} name="application-name" />
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta content="black-translucent" name="apple-mobile-web-app-status-bar-style" />
        <meta content={APP_TITLE} name="apple-mobile-web-app-title" />
        <meta content={APP_DESCRIPTION} name="description" />
        <meta content="yes" name="mobile-web-app-capable" />
        <meta content="#fff" media="(prefers-color-scheme: light)" name="theme-color" />
        <meta content="#000" media="(prefers-color-scheme: dark)" name="theme-color" />

        <link href="/manifest.json" rel="manifest" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link color={APP_MASK_ICON_COLOR} href="/favicon.svg" rel="mask-icon" />
        <link href="/favicon.svg" rel="shortcut icon" />
        <link href="/icons/apple-touch-icon-180.png" rel="apple-touch-icon" />

        <meta content="/icons/msapplication-128.png" name="msapplication-square70x70logo" />
        <meta content="/icons/msapplication-270.png" name="msapplication-square150x150logo" />
        <meta content="/icons/msapplication-558.png" name="msapplication-square310x310logo" />
        <meta content="/icons/msapplication-558x270.png" name="msapplication-wide310x150logo" />

        <meta content="summary" name="twitter:card" />
        <meta content={APP_TITLE} name="twitter:title" />
        <meta content={APP_TITLE} name="twitter:text:title" />
        <meta content={APP_DESCRIPTION} name="twitter:description" />
        <meta content="@DeptAgency" name="twitter:site" />
        <meta content={`${APP_URL}/icons/icon-512.png`} name="twitter:image" />
        <meta content={`${APP_TITLE} App Icon`} name="twitter:image:alt" />
        <meta content="website" property="og:type" />
        <meta content={APP_TITLE} property="og:site_name" />
        <meta content={APP_TITLE} property="og:title" />
        <meta content={APP_DESCRIPTION} property="og:description" />
        <meta content={APP_URL} property="og:url" />
        <meta content={`${APP_URL}/icons/apple-touch-icon-180.png`} property="og:image" />

        {APPLE_SPLASH_SIZES.map((splashSize, i) => (
          <AppleSplash key={i} {...splashSize} />
        ))}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
