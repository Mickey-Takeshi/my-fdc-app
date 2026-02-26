/**
 * app/api/admin/sa/security-logs/route.ts
 *
 * Phase 19: セキュリティログ API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireSuperAdmin } from '@/lib/server/super-admin';

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
  const severity = searchParams.get('severity');
  const eventType = searchParams.get('event_type');
  const days = parseInt(searchParams.get('days') || '7', 10);
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);

  let query = supabase
    .from('security_logs')
    .select(`
      id,
      event_type,
      user_id,
      ip_address,
      user_agent,
      details,
      severity,
      created_at
    `)
    .gte('created_at', daysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (severity) {
    query = query.eq('severity', severity);
  }

  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  const { data: logs, error } = await query;

  if (error) {
    console.error('[SA Security] Failed to fetch logs:', error.message);
    return NextResponse.json({ error: 'Failed to fetch security logs' }, { status: 500 });
  }

  // ユーザー情報を付加
  const userIds = [...new Set((logs || []).map((log) => log.user_id).filter(Boolean))];
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .in('id', userIds);

  const userMap = new Map((users || []).map((u) => [u.id, u.email]));

  const logsWithEmail = (logs || []).map((log) => ({
    ...log,
    user_email: log.user_id ? userMap.get(log.user_id) || null : null,
  }));

  // サマリー統計
  const { count: criticalCount } = await supabase
    .from('security_logs')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'critical')
    .gte('created_at', daysAgo.toISOString());

  const { count: warningCount } = await supabase
    .from('security_logs')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'warning')
    .gte('created_at', daysAgo.toISOString());

  return NextResponse.json({
    logs: logsWithEmail,
    summary: {
      critical_count: criticalCount || 0,
      warning_count: warningCount || 0,
      total_count: logs?.length || 0,
    },
  });
}
