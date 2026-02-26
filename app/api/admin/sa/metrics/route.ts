/**
 * app/api/admin/sa/metrics/route.ts
 *
 * Phase 19: システムメトリクス API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireSuperAdmin, getDashboardStats } from '@/lib/server/super-admin';

export async function GET(request: NextRequest) {
  // SA 権限チェック
  const userId = await requireSuperAdmin();
  if (!userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const days = parseInt(searchParams.get('days') || '7', 10);

  // ダッシュボード統計を取得
  const stats = await getDashboardStats();

  // メトリクス履歴を取得
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  let query = supabase
    .from('system_metrics')
    .select('*')
    .gte('recorded_at', daysAgo.toISOString())
    .order('recorded_at', { ascending: false })
    .limit(100);

  if (type) {
    query = query.eq('metric_type', type);
  }

  const { data: metrics, error } = await query;

  if (error) {
    console.error('[SA Metrics] Failed to fetch metrics:', error.message);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }

  return NextResponse.json({
    stats,
    metrics: metrics || [],
  });
}
