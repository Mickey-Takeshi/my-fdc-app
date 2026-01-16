import type { NextConfig } from 'next';
import { securityHeaders } from './lib/security/headers';

const nextConfig: NextConfig = {
  // セキュリティヘッダーを追加
  async headers() {
    return [
      {
        // 全ルートに適用
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
