/**
 * lib/server/logger.ts
 *
 * Phase 21: 構造化ログ
 */

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});

/**
 * リクエストID付きロガーを作成
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

/**
 * ワークスペースコンテキスト付きロガーを作成
 */
export function createWorkspaceLogger(workspaceId: string, userId: string) {
  return logger.child({ workspaceId, userId });
}

/**
 * PII（個人情報）をマスクする
 */
export function maskPII(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'email',
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
  ];
  const masked = { ...data };

  for (const key of sensitiveKeys) {
    if (key in masked) {
      masked[key] = '***MASKED***';
    }
  }

  return masked;
}
