/**
 * app/api/workspaces/[workspaceId]/audit-logs/route.ts
 *
 * Phase 18: 監査ログ API
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth, isAuthError } from '@/lib/server/api-auth';
import { getAuditLogs } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ workspaceId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;

    // 認証・権限チェック（OWNER/ADMIN のみ）
    const auth = await checkAdminAuth(request, workspaceId);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
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
