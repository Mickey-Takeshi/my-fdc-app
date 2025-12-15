/**
 * app/api/admin/sa/tenants/route.ts
 *
 * Phase 19: テナント（ワークスペース）一覧 API
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireSuperAdmin } from '@/lib/server/super-admin';

export async function GET() {
  // SA 権限チェック
  const userId = await requireSuperAdmin();
  if (!userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  // ワークスペース一覧を取得（オーナー情報付き）
  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select(`
      id,
      name,
      created_at,
      owner:users!workspaces_owner_id_fkey (
        id,
        email,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SA Tenants] Failed to fetch workspaces:', error.message);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }

  // メンバー数を取得
  const tenants = await Promise.all(
    (workspaces || []).map(async (ws) => {
      const { count } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', ws.id);

      const owner = ws.owner as unknown as { id: string; email: string; name: string } | null;

      return {
        id: ws.id,
        name: ws.name,
        owner_id: owner?.id || '',
        owner_email: owner?.email || '',
        owner_name: owner?.name || '',
        member_count: count || 0,
        created_at: ws.created_at,
        is_active: true, // TODO: アクティブ状態の追跡
      };
    })
  );

  return NextResponse.json({ tenants });
}
