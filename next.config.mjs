/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  devIndicators: false,

  async redirects() {
    return [
      {
        source: '/admin/:path*',
        destination: '/research-fund-system/admin/:path*',
        permanent: false,
      },
      {
        source: '/member/:path*',
        destination: '/research-fund-system/member/:path*',
        permanent: false,
      },
      {
        source: '/executive/:path*',
        destination: '/research-fund-system/executive/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
