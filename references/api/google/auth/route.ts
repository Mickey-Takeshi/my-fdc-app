/**
 * app/api/google/auth/route.ts
 *
 * Phase 10-D: Google API 連携開始エンドポイント
 *
 * 【機能】
 * - Google OAuth 認証フローを開始
 * - 認証 URL を返却
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { buildAuthUrl, generateState, getOAuthConfig, DEFAULT_SCOPES } from '@/lib/google/oauth';
import { googleLogger } from '@/lib/server/logger';
import { checkUserTenantBoundary } from '@/lib/server/workspace-auth';
import { withSecurityMonitor } from '@/lib/server/security-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/google/auth
 *
 * Google OAuth 認証を開始し、認証 URL を返却
 */
export async function GET(_request: NextRequest) {
  googleLogger.info('[Google Auth] ========== START ==========');

  try {
    // Phase 14.9: セキュリティ監視（レート制限）
    const security = await withSecurityMonitor(_request, {
      rateLimit: true,
      validateInput: false, // GETリクエスト、パラメータなし
    });
    if (security.blocked) {
      return security.response;
    }
    // 1. セッション確認
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      googleLogger.error('[Google Auth] No session token');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please login first' },
        { status: 401 }
      );
    }

    // 2. ユーザー情報取得
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      googleLogger.error({ err: sessionError }, '[Google Auth] Invalid session');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Session expired' },
        { status: 401 }
      );
    }

    googleLogger.info({ userId: session.user_id }, '[Google Auth] User ID');

    // Phase 14.9-C: ユーザーテナント境界チェック
    const tenantCheck = await checkUserTenantBoundary(_request, session.user_id);
    if (!tenantCheck.success) {
      return tenantCheck.response;
    }

    // 3. OAuth 設定を取得
    let config;
    try {
      config = getOAuthConfig();
    } catch (error) {
      googleLogger.error({ err: error }, '[Google Auth] OAuth config error');
      return NextResponse.json(
        { error: 'Configuration Error', message: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    // 4. state パラメータ生成
    const state = generateState(session.user_id);

    // 5. 認証 URL を生成
    const authUrl = buildAuthUrl(config, state, DEFAULT_SCOPES);

    googleLogger.info('[Google Auth] Auth URL generated');
    googleLogger.info('[Google Auth] ========== SUCCESS ==========');

    return NextResponse.json({ authUrl });

  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Auth] ========== ERROR ==========');

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to start Google auth' },
      { status: 500 }
    );
  }
}
