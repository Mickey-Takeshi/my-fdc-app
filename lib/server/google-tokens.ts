/**
 * lib/server/google-tokens.ts
 *
 * Phase 12: Google トークン管理
 * users テーブルに保存されたトークンを管理
 */

import { createAdminClient } from '@/lib/supabase/client';
import { encrypt, decrypt } from '@/lib/utils/encryption';

interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
}

/**
 * ユーザーの Google トークンを取得（復号）
 */
export async function getGoogleTokens(userId: string): Promise<GoogleTokens | null> {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expires_at, google_scopes')
    .eq('id', userId)
    .single();

  if (error || !data?.google_access_token) {
    return null;
  }

  try {
    return {
      accessToken: decrypt(data.google_access_token),
      refreshToken: data.google_refresh_token ? decrypt(data.google_refresh_token) : undefined,
      expiresAt: data.google_token_expires_at ? new Date(data.google_token_expires_at) : undefined,
      scopes: data.google_scopes,
    };
  } catch (err) {
    console.error('Error decrypting tokens:', err);
    return null;
  }
}

/**
 * トークンが期限切れかどうか確認
 */
export function isTokenExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return true;
  // 5分の余裕を持たせる
  return new Date() >= new Date(expiresAt.getTime() - 5 * 60 * 1000);
}

/**
 * リフレッシュトークンでアクセストークンを更新
 */
export async function refreshGoogleAccessToken(userId: string): Promise<string | null> {
  const tokens = await getGoogleTokens(userId);
  if (!tokens?.refreshToken) {
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    console.error('Failed to refresh token:', await response.text());
    return null;
  }

  const data = await response.json();

  // 新しいトークンを保存
  const supabase = createAdminClient();
  if (supabase) {
    await supabase.from('users').update({
      google_access_token: encrypt(data.access_token),
      google_token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    }).eq('id', userId);
  }

  return data.access_token;
}

/**
 * 有効なアクセストークンを取得（必要に応じてリフレッシュ）
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const tokens = await getGoogleTokens(userId);
  if (!tokens) {
    return null;
  }

  if (!isTokenExpired(tokens.expiresAt)) {
    return tokens.accessToken;
  }

  // トークンが期限切れの場合はリフレッシュ
  return refreshGoogleAccessToken(userId);
}

/**
 * Google 連携を解除
 */
export async function disconnectGoogle(userId: string): Promise<void> {
  const tokens = await getGoogleTokens(userId);

  // Google 側でトークンを無効化
  if (tokens?.accessToken) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.accessToken}`, {
      method: 'POST',
    }).catch(() => {});
  }

  // DB からトークンを削除
  const supabase = createAdminClient();
  if (supabase) {
    await supabase.from('users').update({
      google_access_token: null,
      google_refresh_token: null,
      google_token_expires_at: null,
      google_api_enabled: false,
      google_scopes: null,
    }).eq('id', userId);
  }
}
