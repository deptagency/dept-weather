/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public'
});

const STATIC_ASSET_CACHE_HEADERS = [
  {
    key: 'Cache-Control',
    value: 'public, immutable, max-age=7776000' // 90 days
  }
];
const CACHED_STATIC_ASSET_SOURCES = [
  '/icons/(.*)',
  '/splash-screens/(.*)',
  '/weather-icons/(.*)',
  '/cities-top10000-bundled-cache.json',
  '/favicon.svg'
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    webpackBuildWorker: true
  },
  async headers() {
    return process.env.NODE_ENV !== 'development'
      ? CACHED_STATIC_ASSET_SOURCES.map(source => ({ source, headers: STATIC_ASSET_CACHE_HEADERS }))
      : [];
  }
};

module.exports = process.env.NODE_ENV !== 'development' ? withPWA(nextConfig) : nextConfig;
