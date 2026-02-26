/**
 * app/api/admin/sa/users/route.ts
 *
 * Phase 19: ユーザー一覧 API
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

  // ユーザー一覧を取得
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, account_type, is_suspended, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SA Users] Failed to fetch users:', error.message);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  // ワークスペース数を取得
  const userSummaries = await Promise.all(
    (users || []).map(async (user) => {
      const { count } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 最終ログイン取得
      const { data: lastSession } = await supabase
        .from('sessions')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        id: user.id,
        email: user.email,
        name: user.name || '',
        account_type: user.account_type || 'MEMBER',
        workspace_count: count || 0,
        last_login_at: lastSession?.created_at || null,
        is_suspended: user.is_suspended || false,
        created_at: user.created_at,
      };
    })
  );

  return NextResponse.json({ users: userSummaries });
}
