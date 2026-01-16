/**
 * lib/security/rate-limit.ts
 *
 * Phase 20: レート制限
 * インメモリ実装（本番環境では Redis 推奨）
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// インメモリストア（開発・小規模向け）
const rateLimitStore = new Map<string, RateLimitEntry>();

// 定期的にクリーンアップ（サーバーサイドでのみ実行）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // 1分ごと
}

export interface RateLimitConfig {
  maxRequests: number; // 期間内の最大リクエスト数
  windowMs: number;    // 期間（ミリ秒）
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * レート制限チェック
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // エントリがないか、期間が過ぎていたらリセット
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count <= config.maxRequests;

  return {
    success,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * 一般的なレート制限設定
 */
export const RATE_LIMITS = {
  // API 全般: 1分間に100リクエスト
  api: { maxRequests: 100, windowMs: 60 * 1000 },

  // ログイン試行: 5分間に5回
  login: { maxRequests: 5, windowMs: 5 * 60 * 1000 },

  // パスワードリセット: 1時間に3回
  passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 },

  // 招待送信: 1時間に20回
  invitation: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
} as const;

/**
 * リクエストから IP アドレスを取得
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}
