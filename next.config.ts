import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next.js 16 設定
  reactStrictMode: true,

  // 画像最適化の外部ドメイン許可
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
