/**
 * 構造化ログ（Pino）
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

export function apiLogger(context: { service: string; workspaceId?: string }) {
  return logger.child({ ...context, correlationId: crypto.randomUUID() });
}

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

export function createWorkspaceLogger(workspaceId: string, userId: string) {
  return logger.child({ workspaceId, userId });
}

const SENSITIVE_KEYS = [
  'email',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
];

export function maskPII(data: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...data };
  for (const key of SENSITIVE_KEYS) {
    if (key in masked) {
      masked[key] = '***MASKED***';
    }
  }
  return masked;
}
