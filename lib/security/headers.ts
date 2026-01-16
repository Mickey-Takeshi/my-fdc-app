/**
 * lib/security/headers.ts
 *
 * Phase 20: セキュリティヘッダー設定
 */

/**
 * CSP ディレクティブを構築
 */
function buildCSP(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let supabaseDomain = '';

  try {
    if (supabaseUrl) {
      supabaseDomain = new URL(supabaseUrl).hostname;
    }
  } catch {
    // URL パースエラーは無視
  }

  const directives = [
    // デフォルトは self のみ
    "default-src 'self'",

    // スクリプト: Next.js の動的機能に必要
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",

    // スタイル: インラインスタイルを許可（React の styled-components 等）
    "style-src 'self' 'unsafe-inline'",

    // 画像: data URI と https を許可
    "img-src 'self' data: https: blob:",

    // フォント: Google Fonts 等
    "font-src 'self' data: https://fonts.gstatic.com",

    // 接続先: Supabase と Google API
    `connect-src 'self' ${supabaseDomain ? `https://${supabaseDomain}` : ''} https://*.supabase.co https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com wss://*.supabase.co`,

    // フレーム: Google OAuth ポップアップ
    "frame-src 'self' https://accounts.google.com",

    // フォームの送信先
    "form-action 'self'",

    // ベース URI
    "base-uri 'self'",

    // object タグ等
    "object-src 'none'",
  ];

  return directives.join('; ');
}

export const securityHeaders = [
  // XSS 対策: ブラウザの XSS フィルターを有効化
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // クリックジャッキング対策: iframe での埋め込みを制限
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // MIME タイプスニッフィング対策
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Referrer 情報の制限
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // 権限ポリシー: 不要な機能を無効化
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: buildCSP(),
  },
];

/**
 * 開発環境用の緩和された CSP を取得
 */
export function getCSPForEnvironment(): string {
  if (process.env.NODE_ENV === 'development') {
    // 開発環境では HMR 等のために緩和
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' ws: wss: https:",
      "font-src 'self' data: https:",
      "frame-src 'self' https:",
    ].join('; ');
  }
  return buildCSP();
}
