/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  devIndicators: false,

  // Production: ตัด console.* ทั้งหมดออกตอน build (รวม console.error ที่ log axios error
  // object เต็มก้อน ซึ่งพก Authorization token + error detail จาก backend) — กันไม่ให้ leak
  // ไปโผล่ที่ browser console. ตอน dev (next dev) ยังเห็น log ครบเหมือนเดิม
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // MOU: proxy /api/v1/* → Go backend (:8080) ป้องกัน CORS ตอน Dev
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl.replace(/\/+$/, '')}/:path*`,
      },
    ];
  },

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
