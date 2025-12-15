/**
 * app/api/google/tasks/lists/route.ts
 *
 * Phase 14: Google タスクリスト一覧 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { getTaskLists } from '@/lib/server/google-tasks';

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

    const taskLists = await getTaskLists(session.userId);

    return NextResponse.json({
      taskLists,
      count: taskLists.length,
    });
  } catch (error) {
    console.error('Error in GET /api/google/tasks/lists:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
