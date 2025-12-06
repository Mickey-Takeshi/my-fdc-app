/**
 * app/api/google/calendars/events/route.ts
 *
 * Phase 10-D/E: Google Calendar イベント管理エンドポイント
 *
 * 【機能】
 * - POST: カレンダーにイベントを作成
 * - PATCH: 既存イベントを更新
 * - DELETE: イベントを削除
 *
 * 【Phase 10-E 追加】
 * - colorId サポート（スートに応じた色）
 * - taskId による紐付け
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { googleLogger } from '@/lib/server/logger';
import { checkUserTenantBoundary } from '@/lib/server/workspace-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/google/calendars/events
 *
 * Google Calendar にイベントを作成
 */
export async function POST(request: NextRequest) {
  googleLogger.info('[Google Calendar Events] ========== POST START ==========');

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
    const tenantCheck = await checkUserTenantBoundary(request, session.user_id);
    if (!tenantCheck.success) {
      return tenantCheck.response;
    }

    // 3. リクエストボディを取得
    const body = await request.json();
    const { calendarId, summary, description, startTime, durationMinutes, colorId, taskId } = body;

    if (!calendarId || !summary || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: calendarId, summary, startTime' },
        { status: 400 }
      );
    }

    // タスクIDをログに記録（デバッグ用）
    if (taskId) {
      googleLogger.info({ taskId }, '[Google Calendar Events] Creating event for task');
    }

    // 4. ユーザーの Google トークン情報を取得
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

    // 5. アクセストークンを復号
    const { decrypt, isValidEncryptedData } = await import('@/lib/server/encryption');

    const encryptedToken = JSON.parse(userData.google_access_token);
    if (!isValidEncryptedData(encryptedToken)) {
      return NextResponse.json(
        { error: 'Invalid token data' },
        { status: 500 }
      );
    }

    const accessToken = decrypt(encryptedToken).toString('utf8');

    // 6. イベントの開始・終了時間を計算
    const start = new Date(startTime);
    const end = new Date(start.getTime() + (durationMinutes || 30) * 60 * 1000);

    // 7. Google Calendar API でイベントを作成
    // イベントデータを構築
    const eventData: Record<string, unknown> = {
      summary,
      description: description || '',
      start: {
        dateTime: start.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
    };

    // 色を指定（スートに応じた Google Calendar カラー）
    // Google Calendar colorId: 1-11
    // spade → 8 (Graphite), heart → 11 (Tomato), diamond → 5 (Banana), club → 7 (Peacock)
    if (colorId) {
      eventData.colorId = colorId;
    }

    const eventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      googleLogger.error({ errorText, status: eventResponse.status }, '[Google Calendar Events] API error');

      if (eventResponse.status === 401) {
        return NextResponse.json(
          { error: 'Token expired', message: 'トークンの有効期限が切れています。再連携してください。' },
          { status: 401 }
        );
      }

      if (eventResponse.status === 403) {
        return NextResponse.json(
          { error: 'Permission denied', message: 'カレンダーへの書き込み権限がありません。' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }

    const createdEvent = await eventResponse.json();

    googleLogger.info({ eventId: createdEvent.id }, '[Google Calendar Events] Event created');
    googleLogger.info('[Google Calendar Events] ========== POST SUCCESS ==========');

    return NextResponse.json({
      id: createdEvent.id,
      summary: createdEvent.summary,
      start: createdEvent.start,
      end: createdEvent.end,
      htmlLink: createdEvent.htmlLink,
    });

  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Calendar Events] ========== POST ERROR ==========');

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/google/calendars/events
 *
 * Google Calendar イベントを更新
 */
export async function PATCH(request: NextRequest) {
  googleLogger.info('[Google Calendar Events] ========== PATCH START ==========');

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
    const tenantCheckPatch = await checkUserTenantBoundary(request, session.user_id);
    if (!tenantCheckPatch.success) {
      return tenantCheckPatch.response;
    }

    // 3. リクエストボディを取得
    const body = await request.json();
    const { calendarId, eventId, summary, description, startTime, durationMinutes, colorId } = body;

    if (!calendarId || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields: calendarId, eventId' },
        { status: 400 }
      );
    }

    // 4. ユーザーの Google トークン情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('google_access_token, google_api_enabled')
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
    const { decrypt, isValidEncryptedData } = await import('@/lib/server/encryption');

    const encryptedToken = JSON.parse(userData.google_access_token);
    if (!isValidEncryptedData(encryptedToken)) {
      return NextResponse.json({ error: 'Invalid token data' }, { status: 500 });
    }

    const accessToken = decrypt(encryptedToken).toString('utf8');

    // 6. イベントデータを構築
    const eventData: Record<string, unknown> = {};
    if (summary) eventData.summary = summary;
    if (description !== undefined) eventData.description = description;
    if (colorId) eventData.colorId = colorId;

    if (startTime) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + (durationMinutes || 30) * 60 * 1000);
      eventData.start = { dateTime: start.toISOString(), timeZone: 'Asia/Tokyo' };
      eventData.end = { dateTime: end.toISOString(), timeZone: 'Asia/Tokyo' };
    }

    // 7. Google Calendar API でイベントを更新
    const eventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      googleLogger.error({ errorText }, '[Google Calendar Events] PATCH API error');
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }

    const updatedEvent = await eventResponse.json();
    googleLogger.info({ eventId }, '[Google Calendar Events] Event updated');

    return NextResponse.json({
      id: updatedEvent.id,
      summary: updatedEvent.summary,
      start: updatedEvent.start,
      end: updatedEvent.end,
      htmlLink: updatedEvent.htmlLink,
    });

  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Calendar Events] PATCH ERROR');
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

/**
 * DELETE /api/google/calendars/events
 *
 * Google Calendar イベントを削除
 */
export async function DELETE(request: NextRequest) {
  googleLogger.info('[Google Calendar Events] ========== DELETE START ==========');

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
    const tenantCheckDel = await checkUserTenantBoundary(request, session.user_id);
    if (!tenantCheckDel.success) {
      return tenantCheckDel.response;
    }

    // 3. リクエストボディを取得
    const body = await request.json();
    const { calendarId, eventId } = body;

    if (!calendarId || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields: calendarId, eventId' },
        { status: 400 }
      );
    }

    // 4. ユーザーの Google トークン情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('google_access_token, google_api_enabled')
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
    const { decrypt, isValidEncryptedData } = await import('@/lib/server/encryption');

    const encryptedToken = JSON.parse(userData.google_access_token);
    if (!isValidEncryptedData(encryptedToken)) {
      return NextResponse.json({ error: 'Invalid token data' }, { status: 500 });
    }

    const accessToken = decrypt(encryptedToken).toString('utf8');

    // 6. Google Calendar API でイベントを削除
    const deleteResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!deleteResponse.ok && deleteResponse.status !== 410) {
      // 410 Gone は既に削除済み（許容する）
      const errorText = await deleteResponse.text();
      googleLogger.error({ errorText }, '[Google Calendar Events] DELETE API error');
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    googleLogger.info({ eventId }, '[Google Calendar Events] Event deleted');

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Calendar Events] DELETE ERROR');
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
