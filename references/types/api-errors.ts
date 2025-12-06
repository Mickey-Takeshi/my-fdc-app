/**
 * lib/types/api-errors.ts
 *
 * 【Phase 13】API エラー型統一
 * - 一貫性のあるエラーハンドリング
 * - any型を排除
 */

/**
 * 汎用APIエラー型
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Supabaseエラー型
 */
export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * HTTPエラーレスポンス型
 */
export interface HttpErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
}

/**
 * 未知のエラーをApiErrorに変換
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: { name: error.name, stack: error.stack },
    };
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    return {
      code: (err.code as string) || 'UNKNOWN_ERROR',
      message: (err.message as string) || 'An unexpected error occurred',
      details: err,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
  };
}

/**
 * Supabaseエラー判定
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * エラーメッセージを安全に取得
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as Record<string, unknown>).message);
  }
  return String(error);
}
