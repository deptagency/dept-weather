/** @type {import('next').NextConfig} */

const STATIC_ASSET_CACHE_HEADERS = [
  {
    key: 'Cache-Control',
    value: 'public, immutable, max-age=7776000' // 90 days
  }
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/cities-top10000-gid-cache.json',
        headers: STATIC_ASSET_CACHE_HEADERS
      },
      // {
      //   source: '/favicons/(.*)',
      //   headers: STATIC_ASSET_CACHE_HEADERS
      // },
      {
        source: '/fonts/(.*)',
        headers: STATIC_ASSET_CACHE_HEADERS
      },
      {
        source: '/weather-icons/(.*)',
        headers: STATIC_ASSET_CACHE_HEADERS
      }
    ];
  }
};

module.exports = nextConfig;
