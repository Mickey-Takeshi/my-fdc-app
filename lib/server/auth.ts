/**
 * lib/server/auth.ts
 *
 * 認証ヘルパー（サーバーサイド）
 * Phase 3: セッション管理
 */

import { createAdminClient } from '@/lib/supabase/client';

// セッション有効期間（7日間）
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * セッション情報の型
 */
export interface SessionInfo {
  userId: string;
  expiresAt: Date;
}

/**
 * ユーザー情報の型
 */
export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  accountType: 'SA' | 'USER' | 'TEST';
  createdAt: Date;
}

/**
 * セッショントークンを生成
 */
export function generateSessionToken(): string {
  return `fdc_${crypto.randomUUID()}`;
}

/**
 * 新しいセッションを作成
 */
export async function createSession(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn('[Auth] Supabase not configured, using mock session');
    return generateSessionToken();
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const { error } = await supabase.from('sessions').insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[Auth] Failed to create session:', error.message);
    return null;
  }

  return token;
}

/**
 * セッショントークンを検証してセッション情報を取得
 */
export async function validateSession(token: string): Promise<SessionInfo | null> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn('[Auth] Supabase not configured, using mock validation');
    return null;
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return {
    userId: data.user_id,
    expiresAt: new Date(data.expires_at),
  };
}

/**
 * セッションを削除
 */
export async function deleteSession(token: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn('[Auth] Supabase not configured');
    return true;
  }

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('token', token);

  if (error) {
    console.error('[Auth] Failed to delete session:', error.message);
    return false;
  }

  return true;
}

/**
 * ユーザー情報を取得
 */
export async function getUserById(userId: string): Promise<UserInfo | null> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn('[Auth] Supabase not configured');
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, picture, account_type, created_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
    accountType: data.account_type || 'USER',
    createdAt: new Date(data.created_at),
  };
}

/**
 * ユーザーを作成または更新（upsert）
 */
export async function upsertUser(
  email: string,
  name?: string,
  picture?: string
): Promise<string | null> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn('[Auth] Supabase not configured, using mock user');
    return 'mock-user-id';
  }

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        email,
        name: name || null,
        picture: picture || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'email',
        ignoreDuplicates: false,
      }
    )
    .select('id')
    .single();

  if (error || !data) {
    console.error('[Auth] Failed to upsert user:', error?.message);
    return null;
  }

  return data.id;
}

/**
 * 期限切れセッションを削除（クリーンアップ用）
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const supabase = createAdminClient();
  if (!supabase) {
    return 0;
  }

  const { data, error } = await supabase
    .from('sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    console.error('[Auth] Failed to cleanup sessions:', error.message);
    return 0;
  }

  return data?.length || 0;
}
