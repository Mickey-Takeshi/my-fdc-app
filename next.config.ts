import type { NextConfig } from 'next';
import { securityHeaders } from './lib/security/headers';

const nextConfig: NextConfig = {
  // pino はサーバー専用。バンドラーに含めない
  serverExternalPackages: ['pino', 'pino-pretty'],

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
