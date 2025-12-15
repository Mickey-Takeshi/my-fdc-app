/**
 * app/api/google/calendars/route.ts
 *
 * Phase 13: カレンダー一覧取得 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { getCalendarList } from '@/lib/server/google-calendar';

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

    const calendars = await getCalendarList(session.userId);

    return NextResponse.json({
      calendars,
      count: calendars.length,
    });
  } catch (error) {
    console.error('Error in GET /api/google/calendars:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
