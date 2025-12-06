/**
 * app/api/google/sync/handlers/token-utils.ts
 *
 * Phase 14.6.4: Google トークン管理ユーティリティ
 * Phase 15-A: リフレッシュトークンの鍵バージョン管理対応
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  decrypt,
  encrypt,
  isValidEncryptedData,
  decryptRefreshToken,
} from '@/lib/server/encryption';
import { isTokenExpired, refreshAccessToken, getOAuthConfig } from '@/lib/google/oauth';
import {
  acquireTokenRefreshLock,
  releaseTokenRefreshLock,
} from '@/lib/server/sync-queue';
import { googleLogger } from '@/lib/server/logger';

interface GoogleTokenRow {
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expires_at: string | null;
  google_api_enabled: boolean | null;
  token_key_version: string | null;
}

/**
 * ユーザーの Google API トークンを取得・更新
 */
export async function getValidAccessToken(
  supabase: SupabaseClient,
  userId: number
): Promise<{ accessToken: string; needsUpdate: boolean; newTokenData?: Record<string, string> }> {
  const { data, error } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expires_at, google_api_enabled, token_key_version')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  const user = data as GoogleTokenRow;

  if (!user.google_api_enabled) {
    throw new Error('Google API not enabled');
  }

  if (!user.google_access_token || !user.google_refresh_token) {
    throw new Error('Google tokens not found');
  }

  // アクセストークンは既存形式で復号
  const encryptedAccessToken = JSON.parse(user.google_access_token);
  if (!isValidEncryptedData(encryptedAccessToken)) {
    throw new Error('Invalid access token data');
  }
  let accessToken = decrypt(encryptedAccessToken).toString('utf8');

  // Phase 15-A: リフレッシュトークンは新形式で復号
  // decryptRefreshToken は旧形式（legacy）と新形式の両方に対応
  const refreshToken = decryptRefreshToken(
    user.google_refresh_token,
    user.token_key_version ?? undefined
  );

  if (user.google_token_expires_at && isTokenExpired(user.google_token_expires_at)) {
    googleLogger.info('[Google Sync] Access token expired, refreshing...');

    const lockAcquired = await acquireTokenRefreshLock(String(userId));
    if (!lockAcquired) {
      googleLogger.info('[Google Sync] Token refresh lock held by another request, waiting...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { data: refreshedData } = await supabase
        .from('users')
        .select('google_access_token, google_token_expires_at')
        .eq('id', userId)
        .single();

      if (refreshedData?.google_token_expires_at && !isTokenExpired(refreshedData.google_token_expires_at)) {
        const updatedToken = JSON.parse(refreshedData.google_access_token);
        return {
          accessToken: decrypt(updatedToken).toString('utf8'),
          needsUpdate: false,
        };
      }

      throw new Error('Token refresh in progress by another request');
    }

    try {
      const config = getOAuthConfig();
      const newTokens = await refreshAccessToken(config, refreshToken);

      accessToken = newTokens.accessToken;
      const newEncryptedAccessToken = encrypt(newTokens.accessToken);

      return {
        accessToken,
        needsUpdate: true,
        newTokenData: {
          google_access_token: JSON.stringify(newEncryptedAccessToken),
          google_token_expires_at: newTokens.expiresAt.toISOString(),
        },
      };
    } catch (error) {
      googleLogger.error({ err: error }, '[Google Sync] Token refresh failed');
      throw new Error('Token refresh failed');
    } finally {
      await releaseTokenRefreshLock(String(userId));
    }
  }

  return { accessToken, needsUpdate: false };
}
