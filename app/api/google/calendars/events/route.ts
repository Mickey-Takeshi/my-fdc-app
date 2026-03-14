/**
 * app/api/google/calendars/events/route.ts
 *
 * Google Calendar イベント取得 API（Phase 13）
 * GET /api/google/calendars/events?calendar_id=primary&time_min=...&time_max=...
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getGoogleAccessToken } from '@/lib/server/google-auth';
import { toCalendarEvent, type GoogleEvent } from '@/lib/types/google-calendar';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const accessToken = await getGoogleAccessToken(user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Google API 連携が無効です。再ログインしてください。' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get('calendar_id') || 'primary';

  // デフォルト: 今日の0時〜7日後
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const weekLater = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const timeMin =
    searchParams.get('time_min') || todayStart.toISOString();
  const timeMax =
    searchParams.get('time_max') || weekLater.toISOString();

  try {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      timeZone: 'Asia/Tokyo',
      maxResults: '50',
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Google Events API error:', res.status, errorText);
      return NextResponse.json(
        { error: 'イベントの取得に失敗しました' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const events = (data.items ?? [])
      .filter((item: GoogleEvent) => item.status !== 'cancelled')
      .map((item: GoogleEvent) => toCalendarEvent(item, calendarId));

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json(
      { error: 'Google Calendar API 呼び出しに失敗しました' },
      { status: 500 }
    );
  }
}
