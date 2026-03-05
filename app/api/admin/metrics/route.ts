/**
 * app/api/admin/metrics/route.ts
 *
 * システムメトリクス API（Phase 19 - Super Admin）
 * GET /api/admin/metrics
 * SA のみアクセス可能
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // SA 権限チェック
  const { data: userRow } = await supabase
    .from('users')
    .select('account_type')
    .eq('id', user.id)
    .single();

  if (!userRow || userRow.account_type !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Super Admin 権限が必要です' }, { status: 403 });
  }

  // リアルタイムメトリクスを計算
  const [
    { count: totalUsers },
    { count: totalWorkspaces },
    { count: totalTasks },
    { count: totalBrands },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('workspaces').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('brands').select('*', { count: 'exact', head: true }),
  ]);

  const metrics = {
    totalUsers: totalUsers ?? 0,
    totalWorkspaces: totalWorkspaces ?? 0,
    totalTasks: totalTasks ?? 0,
    totalBrands: totalBrands ?? 0,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ metrics });
}
