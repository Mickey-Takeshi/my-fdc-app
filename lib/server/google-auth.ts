/**
 * lib/server/google-auth.ts
 *
 * Google API トークン管理ユーティリティ（Phase 12）
 * - アクセストークンの取得（期限切れ時は自動リフレッシュ）
 * - リフレッシュトークンによる再発行
 */

import { createServiceClient } from '@/lib/server/supabase';
import { encrypt, decrypt } from '@/lib/server/encryption';

interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
}

/**
 * users テーブルから Google API トークンを取得
 * 期限切れの場合はリフレッシュトークンで再発行
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const supabase = createServiceClient();

  // userId は auth.users.id（google_sub として保存）
  const { data: user } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expires_at, google_api_enabled')
    .eq('google_sub', userId)
    .single();

  if (!user || !user.google_api_enabled || !user.google_access_token) {
    return null;
  }

  const tokens: GoogleTokens = {
    accessToken: decrypt(user.google_access_token),
    refreshToken: user.google_refresh_token ? decrypt(user.google_refresh_token) : null,
    expiresAt: user.google_token_expires_at,
  };

  // トークンが期限切れかチェック（5分の余裕を持つ）
  const isExpired = tokens.expiresAt
    ? new Date(tokens.expiresAt).getTime() < Date.now() + 5 * 60 * 1000
    : true;

  if (isExpired && tokens.refreshToken) {
    // リフレッシュトークンで再発行
    const newToken = await refreshGoogleToken(tokens.refreshToken);
    if (newToken) {
      // DB に新しいトークンを保存
      await supabase
        .from('users')
        .update({
          google_access_token: encrypt(newToken.accessToken),
          google_token_expires_at: newToken.expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('google_sub', userId);

      return newToken.accessToken;
    }
    return null;
  }

  return tokens.accessToken;
}

/**
 * リフレッシュトークンを使って新しいアクセストークンを取得
 */
async function refreshGoogleToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: string } | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      console.error('Google token refresh failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const expiresAt = new Date(
      Date.now() + (data.expires_in ?? 3600) * 1000
    ).toISOString();

    return {
      accessToken: data.access_token,
      expiresAt,
    };
  } catch (error) {
    console.error('Google token refresh error:', error);
    return null;
  }
}
