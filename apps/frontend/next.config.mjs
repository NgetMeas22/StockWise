/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@stockwise/shared'],
  async rewrites() {
    return [
      {
        source: '/en/:path*',
        destination: '/:path*',
      },
      {
        source: '/kh/:path*',
        destination: '/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:4000/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
