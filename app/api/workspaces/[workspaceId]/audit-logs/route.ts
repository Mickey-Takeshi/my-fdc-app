/**
 * app/api/workspaces/[workspaceId]/audit-logs/route.ts
 *
 * Phase 18: 監査ログ API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { checkUserRole, getAuditLogs } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ workspaceId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 権限チェック
    const { allowed } = await checkUserRole(session.userId, workspaceId, ['OWNER', 'ADMIN']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { logs, total } = await getAuditLogs(workspaceId, limit, offset);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error('Error in GET /api/workspaces/[workspaceId]/audit-logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
