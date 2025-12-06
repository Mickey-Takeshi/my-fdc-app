/**
 * app/api/google/calendars/route.ts
 *
 * Phase 10-D: Google Calendar 一覧取得エンドポイント
 * 【Phase 14.9-B】レート制限追加
 *
 * 【機能】
 * - GET: ユーザーのカレンダー一覧を取得
 *
 * 【レート制限】
 * - 制限単位: ユーザーID
 * - 上限: 10リクエスト/分
 * - 理由: Google Calendar API クォータ保護
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { googleLogger } from '@/lib/server/logger';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { checkUserTenantBoundary } from '@/lib/server/workspace-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ========================================
// Phase 14.9-B: Google Calendars レート制限設定
// ========================================

/**
 * Google Calendars API レート制限
 * - 制限単位: ユーザーID
 * - 上限: 10リクエスト/分
 * - 理由: Google Calendar API はユーザー単位でクォータが設定されており、
 *         連続リクエストによるクォータ枯渇を防ぐため
 */
const GOOGLE_CALENDARS_RATE_LIMIT = 10; // req/min
const GOOGLE_CALENDARS_RATE_WINDOW = 60000; // 1分

/**
 * GET /api/google/calendars
 *
 * Google Calendar の一覧を取得
 */
export async function GET(_request: NextRequest) {
  googleLogger.info('[Google Calendars] ========== GET START ==========');

  try {
    // 1. セッション確認
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. セッションからユーザー ID を取得
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Phase 14.9-C: ユーザーテナント境界チェック
    const tenantCheck = await checkUserTenantBoundary(_request, session.user_id);
    if (!tenantCheck.success) {
      return tenantCheck.response;
    }

    // Phase 14.9-B: レート制限チェック
    const rateLimitKey = `google_calendars:${session.user_id}`;
    const rateLimit = await checkRateLimit(rateLimitKey, GOOGLE_CALENDARS_RATE_LIMIT, GOOGLE_CALENDARS_RATE_WINDOW);

    if (!rateLimit.allowed) {
      googleLogger.warn({
        userId: session.user_id,
        current: rateLimit.current,
        limit: rateLimit.limit,
      }, '[Google Calendars] Rate limit exceeded');

      return NextResponse.json(
        {
          error: 'レート制限に達しました。1分後に再試行してください。',
          code: 'RATE_LIMIT_EXCEEDED',
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      );
    }

    // 3. ユーザーの Google トークン情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('google_access_token, google_api_enabled')
      .eq('id', session.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Google API が有効でない場合
    if (!userData.google_api_enabled || !userData.google_access_token) {
      return NextResponse.json(
        { error: 'Google API not connected', message: 'Google連携が設定されていません' },
        { status: 400 }
      );
    }

    // 4. アクセストークンを復号
    const { decrypt, isValidEncryptedData } = await import('@/lib/server/encryption');

    const encryptedToken = JSON.parse(userData.google_access_token);
    if (!isValidEncryptedData(encryptedToken)) {
      return NextResponse.json(
        { error: 'Invalid token data' },
        { status: 500 }
      );
    }

    const accessToken = decrypt(encryptedToken).toString('utf8');

    // 5. Google Calendar API でカレンダー一覧を取得
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      googleLogger.error({ errorText, status: calendarResponse.status }, '[Google Calendars] API error');

      if (calendarResponse.status === 401) {
        return NextResponse.json(
          { error: 'Token expired', message: 'トークンの有効期限が切れています。再連携してください。' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch calendars' },
        { status: 500 }
      );
    }

    const calendarData = await calendarResponse.json();

    // 6. カレンダー一覧を整形
    const calendars = (calendarData.items || []).map((cal: {
      id: string;
      summary: string;
      primary?: boolean;
      backgroundColor?: string;
    }) => ({
      id: cal.id,
      summary: cal.summary,
      primary: cal.primary || false,
      backgroundColor: cal.backgroundColor,
    }));

    googleLogger.info({ count: calendars.length }, '[Google Calendars] Found calendars');
    googleLogger.info('[Google Calendars] ========== GET SUCCESS ==========');

    return NextResponse.json({ calendars });

  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Calendars] ========== GET ERROR ==========');

    return NextResponse.json(
      { error: 'Failed to fetch calendars' },
      { status: 500 }
    );
  }
}
