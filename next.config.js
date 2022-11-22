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
  '/cities-top10000-gid-cache.json',
  '/weather-icons/(.*)',
  '/favicon.svg',
  '/apple-touch-icon.png'
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return CACHED_STATIC_ASSET_SOURCES.map(source => ({ source, headers: STATIC_ASSET_CACHE_HEADERS }));
  }
};

module.exports = withPWA(nextConfig);
