/**
 * app/api/google/calendars/events/route.ts
 *
 * Phase 13: カレンダーイベント取得 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import {
  getEvents,
  getTodayEvents,
  getEventsFromAllCalendars,
  normalizeEvent,
} from '@/lib/server/google-calendar';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId') || 'primary';
    const range = searchParams.get('range') || 'today'; // today, week, month, custom
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');
    const allCalendars = searchParams.get('allCalendars') === 'true';

    let events;

    if (allCalendars) {
      // 全カレンダーから取得
      const options: { timeMin?: Date; timeMax?: Date } = {};

      if (range === 'today') {
        const now = new Date();
        options.timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        options.timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else if (range === 'week') {
        const now = new Date();
        options.timeMin = now;
        options.timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (range === 'month') {
        const now = new Date();
        options.timeMin = now;
        options.timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else if (timeMin && timeMax) {
        options.timeMin = new Date(timeMin);
        options.timeMax = new Date(timeMax);
      }

      events = await getEventsFromAllCalendars(session.userId, options);
    } else {
      // 単一カレンダーから取得
      if (range === 'today') {
        const rawEvents = await getTodayEvents(session.userId, calendarId);
        events = rawEvents.map((e) => normalizeEvent(e, calendarId));
      } else {
        const options: { timeMin?: Date; timeMax?: Date } = {};

        if (range === 'week') {
          const now = new Date();
          options.timeMin = now;
          options.timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (range === 'month') {
          const now = new Date();
          options.timeMin = now;
          options.timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (timeMin && timeMax) {
          options.timeMin = new Date(timeMin);
          options.timeMax = new Date(timeMax);
        }

        const rawEvents = await getEvents(session.userId, calendarId, options);
        events = rawEvents.map((e) => normalizeEvent(e, calendarId));
      }
    }

    return NextResponse.json({
      events,
      count: events.length,
      range,
      calendarId: allCalendars ? 'all' : calendarId,
    });
  } catch (error) {
    console.error('Error in GET /api/google/calendars/events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
