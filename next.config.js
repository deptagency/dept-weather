/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/cities-top10000-gid-cache.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, immutable, stale-while-revalidate, max-age=7776000'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
