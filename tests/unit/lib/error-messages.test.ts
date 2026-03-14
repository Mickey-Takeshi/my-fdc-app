import { describe, it, expect } from 'vitest';
import {
  getUserFriendlyError,
  getErrorContext,
  formatErrorForUser,
} from '@/lib/utils/error-messages';

describe('getUserFriendlyError', () => {
  it('returns auth error for 401', () => {
    const result = getUserFriendlyError(401);
    expect(result.message).toContain('Session');
  });

  it('returns permission error for 403', () => {
    const result = getUserFriendlyError(403);
    expect(result.message).toContain('permissions');
  });

  it('returns validation error for 400', () => {
    const result = getUserFriendlyError(400);
    expect(result.message).toContain('invalid');
  });

  it('returns server error for 500', () => {
    const result = getUserFriendlyError(500);
    expect(result.message).toContain('unexpected');
  });
});

describe('getErrorContext', () => {
  it('returns network for fetch errors', () => {
    const error = new TypeError('Failed to fetch');
    expect(getErrorContext(error)).toBe('network');
  });

  it('returns server for unknown errors', () => {
    expect(getErrorContext(new Error('unknown'))).toBe('server');
  });
});

describe('formatErrorForUser', () => {
  it('formats with status code', () => {
    const result = formatErrorForUser(null, 401);
    expect(result).toContain('Session');
    expect(result).toContain('log in');
  });

  it('formats without status code', () => {
    const result = formatErrorForUser(new TypeError('Failed to fetch'));
    expect(result).toContain('unstable');
  });
});
