/**
 * app/api/google/callback/route.ts
 *
 * Phase 10-D: Google OAuth コールバックエンドポイント
 * Phase 15-A: リフレッシュトークンの鍵バージョン管理対応
 *
 * 【機能】
 * - 認証コードをトークンに交換
 * - トークンを暗号化して DB に保存
 * - リフレッシュトークンは鍵バージョン付きで保存
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  exchangeCodeForTokens,
  getOAuthConfig,
  verifyState,
} from '@/lib/google/oauth';
import { encrypt, encryptRefreshToken } from '@/lib/server/encryption';
import { googleLogger } from '@/lib/server/logger';
import { auditGoogleLinked } from '@/lib/server/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/google/callback
 *
 * Google OAuth コールバック処理
 */
export async function GET(request: NextRequest) {
  googleLogger.debug('[Callback] Processing OAuth callback');

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // エラーチェック
  if (error) {
    googleLogger.error({ error }, '[Callback] OAuth error');
    return NextResponse.redirect(
      new URL(`/settings?google_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    googleLogger.error('[Callback] Missing code or state');
    return NextResponse.redirect(
      new URL('/settings?google_error=invalid_request', request.url)
    );
  }

  try {
    // 1. state を検証してユーザー ID を取得
    let userId: number;
    try {
      userId = verifyState(state);
    } catch (stateError) {
      googleLogger.error({ err: stateError }, '[Callback] Invalid state');
      return NextResponse.redirect(
        new URL('/settings?google_error=invalid_state', request.url)
      );
    }

    googleLogger.debug({ userId }, '[Callback] User ID from state');

    // 2. OAuth 設定を取得
    const config = getOAuthConfig();

    // 3. 認証コードをトークンに交換
    googleLogger.debug('[Callback] Exchanging code for tokens');
    const tokens = await exchangeCodeForTokens(config, code);

    googleLogger.debug({ scopes: tokens.scopes }, '[Callback] Tokens received');

    // 4. トークンを暗号化
    // アクセストークンは既存形式（MASTER_ENCRYPTION_KEY）
    const encryptedAccessToken = encrypt(tokens.accessToken);

    // リフレッシュトークンは新形式（鍵バージョン管理付き）
    // Phase 15-A: encryptRefreshToken は ciphertext と version を返す
    const { ciphertext: encryptedRefreshToken, version: keyVersion } =
      encryptRefreshToken(tokens.refreshToken);

    // 5. DB に保存
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    googleLogger.debug(
      { keyVersion },
      '[Callback] Saving tokens to DB with key version'
    );

    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_access_token: JSON.stringify(encryptedAccessToken),
        // Phase 15-A: 新形式の暗号化データ（鍵バージョン情報を含む）
        google_refresh_token: encryptedRefreshToken,
        // Phase 15-A: 鍵バージョンを別カラムに保存（クエリ用）
        token_key_version: keyVersion,
        google_token_expires_at: tokens.expiresAt.toISOString(),
        google_scopes: tokens.scopes,
        google_api_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      googleLogger.error({ err: updateError }, '[Callback] DB update error');
      return NextResponse.redirect(
        new URL('/settings?google_error=db_error', request.url)
      );
    }

    // Phase 15-B: 監査ログを記録
    await auditGoogleLinked(
      {
        userId: String(userId),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
      {
        scopes: tokens.scopes,
      }
    );

    googleLogger.info({ userId }, '[Callback] OAuth connection successful');

    // 成功時は設定画面にリダイレクト
    return NextResponse.redirect(
      new URL('/settings?google_connected=true', request.url)
    );

  } catch (err: unknown) {
    googleLogger.error({ err }, '[Callback] Error');

    return NextResponse.redirect(
      new URL('/settings?google_error=server_error', request.url)
    );
  }
}
