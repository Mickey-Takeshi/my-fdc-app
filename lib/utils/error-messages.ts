/**
 * lib/utils/error-messages.ts
 *
 * User-friendly error message mapping (Phase 32)
 */

type ErrorContext = 'network' | 'auth' | 'permission' | 'validation' | 'external' | 'server';

interface UserFriendlyError {
  message: string;
  action: string;
}

const ERROR_MAP: Record<ErrorContext, UserFriendlyError> = {
  network: {
    message: 'Connection is unstable',
    action: 'Please check your network and try again',
  },
  auth: {
    message: 'Session has expired',
    action: 'Please log in again',
  },
  permission: {
    message: 'Insufficient permissions',
    action: 'Please contact your workspace administrator',
  },
  validation: {
    message: 'Input data is invalid',
    action: 'Please check the form and correct any errors',
  },
  external: {
    message: 'External service is temporarily unavailable',
    action: 'Other features are still available. Please try again later',
  },
  server: {
    message: 'An unexpected error occurred',
    action: 'Please try again. If the problem persists, contact support',
  },
};

export function getUserFriendlyError(status: number): UserFriendlyError {
  if (status === 401) return ERROR_MAP.auth;
  if (status === 403) return ERROR_MAP.permission;
  if (status === 422 || status === 400) return ERROR_MAP.validation;
  if (status >= 500) return ERROR_MAP.server;
  return ERROR_MAP.server;
}

export function getErrorContext(error: unknown): ErrorContext {
  if (error instanceof TypeError && 'message' in error) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'network';
    }
  }
  return 'server';
}

export function formatErrorForUser(error: unknown, status?: number): string {
  if (status) {
    const friendly = getUserFriendlyError(status);
    return `${friendly.message}. ${friendly.action}`;
  }
  const context = getErrorContext(error);
  const friendly = ERROR_MAP[context];
  return `${friendly.message}. ${friendly.action}`;
}
