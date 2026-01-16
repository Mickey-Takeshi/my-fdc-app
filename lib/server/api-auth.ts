/**
 * lib/server/api-auth.ts
 *
 * API ルート共通認証ヘルパー
 * 全 API エンドポイントで使用する認証・権限チェック機能を統合
 */

import { NextRequest } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { validateSession } from './auth';
import { createAdminClient } from '@/lib/supabase/client';

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface AuthSuccess {
  session: { userId: string; token: string };
  supabase: SupabaseClient;
  role: MemberRole;
  userId: string;
}

export interface AuthError {
  error: string;
  status: number;
}

export type AuthResult = AuthSuccess | AuthError;

/**
 * 認証エラーかどうかを判定
 */
export function isAuthError<T>(result: T | AuthError): result is AuthError {
  return typeof result === 'object' && result !== null && 'error' in result;
}

/**
 * API ルート共通の認証チェック
 * - セッション検証
 * - ワークスペースメンバーシップ確認
 * - ロール取得
 */
export async function checkAuth(
  request: NextRequest,
  workspaceId: string
): Promise<AuthResult> {
  // セッショントークン取得
  const sessionToken = request.cookies.get('fdc_session')?.value;
  if (!sessionToken) {
    return { error: 'Unauthorized', status: 401 };
  }

  // セッション検証
  const session = await validateSession(sessionToken);
  if (!session) {
    return { error: 'Invalid session', status: 401 };
  }

  // Supabase クライアント取得
  const supabase = createAdminClient();
  if (!supabase) {
    return { error: 'Database not configured', status: 500 };
  }

  // ワークスペースメンバーシップ確認
  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', session.userId)
    .single();

  if (error || !membership) {
    return { error: 'Access denied', status: 403 };
  }

  return {
    session: { userId: session.userId, token: sessionToken },
    supabase,
    role: membership.role as MemberRole,
    userId: session.userId,
  };
}

/**
 * 管理者権限チェック（OWNER または ADMIN のみ）
 */
export async function checkAdminAuth(
  request: NextRequest,
  workspaceId: string
): Promise<AuthResult> {
  const result = await checkAuth(request, workspaceId);

  if (isAuthError(result)) {
    return result;
  }

  if (result.role !== 'OWNER' && result.role !== 'ADMIN') {
    return { error: 'Admin access required', status: 403 };
  }

  return result;
}

/**
 * オーナー権限チェック（OWNER のみ）
 */
export async function checkOwnerAuth(
  request: NextRequest,
  workspaceId: string
): Promise<AuthResult> {
  const result = await checkAuth(request, workspaceId);

  if (isAuthError(result)) {
    return result;
  }

  if (result.role !== 'OWNER') {
    return { error: 'Owner access required', status: 403 };
  }

  return result;
}

/**
 * セッションのみチェック（ワークスペース不要）
 */
export async function checkSessionOnly(
  request: NextRequest
): Promise<{ session: { userId: string }; supabase: SupabaseClient } | AuthError> {
  const sessionToken = request.cookies.get('fdc_session')?.value;
  if (!sessionToken) {
    return { error: 'Unauthorized', status: 401 };
  }

  const session = await validateSession(sessionToken);
  if (!session) {
    return { error: 'Invalid session', status: 401 };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return { error: 'Database not configured', status: 500 };
  }

  return { session: { userId: session.userId }, supabase };
}
