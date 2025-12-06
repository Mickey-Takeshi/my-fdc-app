/**
 * app/api/google/calendars/today/route.ts
 *
 * Phase 10-E: 今日の予定取得エンドポイント
 * Phase 15-A: リフレッシュトークンの鍵バージョン管理対応
 *
 * 【機能】
 * - GET: 今日の予定一覧を取得（カットオフ3時〜翌日3時）
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  decrypt,
  encrypt,
  isValidEncryptedData,
  decryptRefreshToken,
} from '@/lib/server/encryption';
import { isTokenExpired, refreshAccessToken, getOAuthConfig } from '@/lib/google/oauth';
import { googleLogger } from '@/lib/server/logger';
import { checkUserTenantBoundary } from '@/lib/server/workspace-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/google/calendars/today
 *
 * 今日の予定を取得（複数カレンダー対応）
 */
export async function GET(request: NextRequest) {
  googleLogger.info('[Google Calendar Today] ========== GET START ==========');

  try {
    // 1. セッション確認
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Phase 14.9-C: ユーザーテナント境界チェック
    const tenantCheck = await checkUserTenantBoundary(request, session.user_id);
    if (!tenantCheck.success) {
      return tenantCheck.response;
    }

    // 3. クエリパラメータを取得
    const url = new URL(request.url);
    const calendarIds = url.searchParams.get('calendarIds')?.split(',') || ['primary'];
    // 日付オフセット: -1=昨日, 0=今日, 1=明日
    const dateOffset = parseInt(url.searchParams.get('dateOffset') || '0', 10);

    // 4. ユーザーの Google トークン情報を取得
    // Phase 15-A: token_key_version も取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('google_access_token, google_refresh_token, google_token_expires_at, google_api_enabled, token_key_version')
      .eq('id', session.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userData.google_api_enabled || !userData.google_access_token) {
      return NextResponse.json(
        { error: 'Google API not connected' },
        { status: 400 }
      );
    }

    // 5. アクセストークンを復号
    const encryptedToken = JSON.parse(userData.google_access_token);
    if (!isValidEncryptedData(encryptedToken)) {
      return NextResponse.json({ error: 'Invalid token data' }, { status: 500 });
    }

    let accessToken = decrypt(encryptedToken).toString('utf8');

    // 5.1 トークンの有効期限をチェックし、必要なら更新
    if (userData.google_token_expires_at && isTokenExpired(userData.google_token_expires_at)) {
      googleLogger.info('[Google Calendar Today] Access token expired, refreshing...');

      if (!userData.google_refresh_token) {
        return NextResponse.json(
          { error: 'Refresh token not found' },
          { status: 400 }
        );
      }

      try {
        // Phase 15-A: 新しい復号関数を使用（旧形式・新形式両対応）
        const refreshToken = decryptRefreshToken(
          userData.google_refresh_token as string,
          (userData.token_key_version as string | null) ?? undefined
        );
        const config = getOAuthConfig();
        const newTokens = await refreshAccessToken(config, refreshToken);

        accessToken = newTokens.accessToken;

        // 新しいトークンをDBに保存
        const newEncryptedAccessToken = encrypt(newTokens.accessToken);
        await supabase
          .from('users')
          .update({
            google_access_token: JSON.stringify(newEncryptedAccessToken),
            google_token_expires_at: newTokens.expiresAt.toISOString(),
          })
          .eq('id', session.user_id);

        googleLogger.info('[Google Calendar Today] Token refreshed successfully');
      } catch (refreshError) {
        googleLogger.error({ err: refreshError }, '[Google Calendar Today] Token refresh failed');
        return NextResponse.json(
          { error: 'Token refresh failed', message: 'Please reconnect Google account' },
          { status: 401 }
        );
      }
    }

    // 6. 日付範囲を計算（午前3時カットオフ）
    const now = new Date();
    const hour = now.getHours();

    // カットオフ時間（午前3時）を考慮した「今日」の開始
    const baseDate = new Date(now);
    if (hour < 3) {
      // 午前0〜2時台は前日扱い
      baseDate.setDate(baseDate.getDate() - 1);
    }
    baseDate.setHours(3, 0, 0, 0);

    // 日付オフセットを適用（-1=昨日, 0=今日, 1=明日）
    const targetStart = new Date(baseDate);
    targetStart.setDate(targetStart.getDate() + dateOffset);

    // 翌日3時まで
    const targetEnd = new Date(targetStart);
    targetEnd.setDate(targetEnd.getDate() + 1);

    googleLogger.info({
      start: targetStart.toISOString(),
      end: targetEnd.toISOString(),
      dateOffset,
    }, '[Google Calendar Today] Time range');

    // 7. 各カレンダーからイベントを取得
    const allEvents: Array<{
      id: string;
      calendarId: string;
      summary: string;
      description?: string;
      start: string;
      end: string;
      colorId?: string;
      isFdcTask: boolean;
      htmlLink?: string;
    }> = [];

    for (const calendarId of calendarIds) {
      const params = new URLSearchParams({
        timeMin: targetStart.toISOString(),
        timeMax: targetEnd.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50',
      });

      const eventsResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!eventsResponse.ok) {
        googleLogger.error({ calendarId }, '[Google Calendar Today] Failed to fetch from calendar');
        continue;
      }

      const eventsData = await eventsResponse.json();
      const events = eventsData.items || [];

      for (const event of events) {
        // 終日イベントはスキップ（date のみ、dateTime なし）
        if (!event.start?.dateTime) continue;

        // FDCタスクかどうかを判定（タイトルに [♠] [♥] [♦] [♣] があるか）
        const isFdcTask = /\[♠\]|\[♥\]|\[♦\]|\[♣\]/.test(event.summary || '');

        allEvents.push({
          id: event.id,
          calendarId,
          summary: event.summary || '(無題)',
          description: event.description,
          start: event.start.dateTime,
          end: event.end?.dateTime || event.start.dateTime,
          colorId: event.colorId,
          isFdcTask,
          htmlLink: event.htmlLink,
        });
      }
    }

    // 8. イベントIDで重複排除（複数カレンダーで同じイベントが取得される場合がある）
    const uniqueEvents = allEvents.filter((event, index, self) =>
      index === self.findIndex(e => e.id === event.id)
    );

    // 9. 開始時間でソート
    uniqueEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    googleLogger.info({
      uniqueCount: uniqueEvents.length,
      totalCount: allEvents.length,
    }, '[Google Calendar Today] Found events (deduped)');
    googleLogger.info('[Google Calendar Today] ========== GET SUCCESS ==========');

    return NextResponse.json({
      events: uniqueEvents,
      timeRange: {
        start: targetStart.toISOString(),
        end: targetEnd.toISOString(),
      },
      dateOffset,
    });

  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Calendar Today] ERROR');
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
