/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@jenosize/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cf.shopee.co.th' },
      { protocol: 'https', hostname: 'lzd-img-global.slatic.net' },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      // Proxy /go/* to the API so users always see /go/<code> on the web origin
      { source: '/go/:code', destination: `${apiUrl}/go/:code` },
    ];
  },
};
export default nextConfig;
