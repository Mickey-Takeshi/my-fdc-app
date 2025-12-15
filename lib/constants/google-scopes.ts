/**
 * lib/constants/google-scopes.ts
 *
 * Phase 12: Google OAuth スコープ定義
 */

// 基本スコープ（Phase 4 から）
export const GOOGLE_BASIC_SCOPES = [
  'openid',
  'email',
  'profile',
];

// Calendar スコープ
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

// Tasks スコープ
export const GOOGLE_TASKS_SCOPES = [
  'https://www.googleapis.com/auth/tasks',
];

// 全スコープ（Phase 12 で使用）
export const GOOGLE_ALL_SCOPES = [
  ...GOOGLE_BASIC_SCOPES,
  ...GOOGLE_CALENDAR_SCOPES,
  ...GOOGLE_TASKS_SCOPES,
];

/**
 * スコープ配列を空白区切りの文字列に変換
 */
export function scopesToString(scopes: string[]): string {
  return scopes.join(' ');
}

/**
 * 空白区切りの文字列をスコープ配列に変換
 */
export function stringToScopes(scopeString: string): string[] {
  return scopeString.split(' ').filter(Boolean);
}
