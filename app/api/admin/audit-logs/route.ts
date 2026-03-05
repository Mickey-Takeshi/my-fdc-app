/**
 * app/api/admin/audit-logs/route.ts
 *
 * 監査ログ取得 API（Phase 18）
 * GET /api/admin/audit-logs?workspace_id=xxx
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toAuditLog, type AuditLogRow } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const workspaceId = request.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id は必須です' }, { status: 400 });
  }

  const role = await requireRole(user.id, workspaceId, 'ADMIN');
  if (!role) {
    return NextResponse.json({ error: 'ADMIN以上の権限が必要です' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json({ error: '監査ログの取得に失敗しました' }, { status: 500 });
  }

  const logs = (data as AuditLogRow[]).map(toAuditLog);
  return NextResponse.json({ logs });
}
