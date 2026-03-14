/**
 * app/api/google/calendars/route.ts
 *
 * Google Calendar 一覧取得 API（Phase 13）
 * GET /api/google/calendars
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getGoogleAccessToken } from '@/lib/server/google-auth';
import type { GoogleCalendar } from '@/lib/types/google-calendar';

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

  try {
    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Google Calendar API error:', res.status, errorText);
      return NextResponse.json(
        { error: 'カレンダー一覧の取得に失敗しました' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const calendars: GoogleCalendar[] = (data.items ?? []).map(
      (item: GoogleCalendar) => ({
        id: item.id,
        summary: item.summary,
        primary: item.primary ?? false,
        backgroundColor: item.backgroundColor,
        accessRole: item.accessRole,
      })
    );

    return NextResponse.json({ calendars });
  } catch {
    return NextResponse.json(
      { error: 'Google Calendar API 呼び出しに失敗しました' },
      { status: 500 }
    );
  }
}
