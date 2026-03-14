/**
 * app/api/admin/tenants/route.ts
 *
 * テナント一覧 API（Phase 19 - Super Admin）
 * GET /api/admin/tenants
 * SA のみアクセス可能
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import type { TenantSummary } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // SA 権限チェック（account_type = 'SUPER_ADMIN'）
  const { data: userRow } = await supabase
    .from('users')
    .select('account_type')
    .eq('id', user.id)
    .single();

  if (!userRow || userRow.account_type !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Super Admin 権限が必要です' }, { status: 403 });
  }

  // 全ワークスペースを取得
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false });

  if (wsError) {
    console.error('Tenants list error:', wsError);
    return NextResponse.json({ error: 'テナント情報の取得に失敗しました' }, { status: 500 });
  }

  // 各ワークスペースのメンバー数とオーナー情報を取得
  const tenants: TenantSummary[] = [];

  for (const ws of workspaces ?? []) {
    const { count } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', ws.id);

    const { data: owner } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', ws.id)
      .eq('role', 'OWNER')
      .single();

    let ownerEmail = '';
    if (owner) {
      const { data: ownerUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', owner.user_id)
        .single();
      ownerEmail = ownerUser?.email ?? '';
    }

    tenants.push({
      workspaceId: ws.id,
      workspaceName: ws.name,
      ownerEmail,
      memberCount: count ?? 0,
      createdAt: ws.created_at,
    });
  }

  return NextResponse.json({ tenants });
}
