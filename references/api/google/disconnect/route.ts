/**
 * app/api/google/disconnect/route.ts
 *
 * Phase 10-D: Google API 連携解除エンドポイント
 * Phase 15-A: リフレッシュトークンの鍵バージョン管理対応
 *
 * 【機能】
 * - Google トークンを無効化
 * - DB からトークン情報を削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { revokeToken } from '@/lib/google/oauth';
import { decryptRefreshToken } from '@/lib/server/encryption';
import { googleLogger } from '@/lib/server/logger';
import { checkUserTenantBoundary } from '@/lib/server/workspace-auth';
import { auditGoogleUnlinked } from '@/lib/server/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/google/disconnect
 *
 * Google API 連携を解除
 */
export async function POST(_request: NextRequest) {
  googleLogger.info('[Google Disconnect] ========== START ==========');

  try {
    // 1. セッション確認
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      googleLogger.error('[Google Disconnect] No session token');
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
      googleLogger.error({ err: sessionError }, '[Google Disconnect] Invalid session');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Session expired' },
        { status: 401 }
      );
    }

    googleLogger.info({ userId: session.user_id }, '[Google Disconnect] User ID');

    // Phase 14.9-C: ユーザーテナント境界チェック
    const tenantCheck = await checkUserTenantBoundary(_request, session.user_id);
    if (!tenantCheck.success) {
      return tenantCheck.response;
    }

    // 3. 現在のトークンを取得
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('google_access_token, google_refresh_token, token_key_version')
      .eq('id', session.user_id)
      .single();

    if (userError) {
      googleLogger.error({ err: userError }, '[Google Disconnect] User fetch error');
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    // 4. トークンを無効化（Google 側）
    // Phase 15-A: 新しい復号関数を使用（旧形式・新形式両対応）
    if (user?.google_refresh_token) {
      try {
        const refreshToken = decryptRefreshToken(
          user.google_refresh_token,
          user.token_key_version ?? undefined
        );
        await revokeToken(refreshToken);
        googleLogger.info('[Google Disconnect] Token revoked');
      } catch (error) {
        // トークン無効化に失敗しても続行
        googleLogger.warn({ err: error }, '[Google Disconnect] Token revocation failed');
      }
    }

    // 5. DB からトークン情報を削除
    // Phase 15-A: token_key_version も削除
    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expires_at: null,
        google_scopes: null,
        google_api_enabled: false,
        google_last_synced_at: null,
        token_key_version: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user_id);

    if (updateError) {
      googleLogger.error({ err: updateError }, '[Google Disconnect] DB update error');
      return NextResponse.json(
        { error: 'Internal Error', message: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Phase 15-B: 監査ログを記録
    await auditGoogleUnlinked(
      {
        userId: String(session.user_id),
        ipAddress: _request.headers.get('x-forwarded-for') || _request.headers.get('x-real-ip') || undefined,
        userAgent: _request.headers.get('user-agent') || undefined,
      },
      {
        reason: 'user_initiated',
      }
    );

    googleLogger.info('[Google Disconnect] Disconnected successfully');
    googleLogger.info('[Google Disconnect] ========== SUCCESS ==========');

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Disconnect] ========== ERROR ==========');

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to disconnect Google' },
      { status: 500 }
    );
  }
}
