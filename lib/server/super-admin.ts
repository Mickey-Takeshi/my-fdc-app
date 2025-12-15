/**
 * lib/server/super-admin.ts
 *
 * Phase 19: Super Admin サーバーヘルパー
 */

import { createAdminClient } from '@/lib/supabase/client';
import { validateSession, getUserById } from './auth';
import { cookies } from 'next/headers';

/**
 * 現在のユーザーが Super Admin かどうかを確認
 */
export async function isSuperAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    return false;
  }

  const session = await validateSession(token);
  if (!session) {
    return false;
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return false;
  }

  return user.accountType === 'SA';
}

/**
 * Super Admin 権限を要求し、ユーザー ID を返す
 * 権限がない場合は null を返す
 */
export async function requireSuperAdmin(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    return null;
  }

  const session = await validateSession(token);
  if (!session) {
    return null;
  }

  const user = await getUserById(session.userId);
  if (!user || user.accountType !== 'SA') {
    return null;
  }

  return session.userId;
}

/**
 * セキュリティログを記録
 */
export async function logSecurityEvent(
  eventType: string,
  userId: string | null,
  details: Record<string, unknown> = {},
  severity: 'info' | 'warning' | 'critical' = 'info',
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn('[SuperAdmin] Supabase not configured, skipping security log');
    return;
  }

  const { error } = await supabase.from('security_logs').insert({
    event_type: eventType,
    user_id: userId,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    details,
    severity,
  });

  if (error) {
    console.error('[SuperAdmin] Failed to log security event:', error.message);
  }
}

/**
 * システムメトリクスを記録
 */
export async function recordMetric(
  metricType: string,
  metricValue: number,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn('[SuperAdmin] Supabase not configured, skipping metric');
    return;
  }

  const { error } = await supabase.from('system_metrics').insert({
    metric_type: metricType,
    metric_value: metricValue,
    metadata,
  });

  if (error) {
    console.error('[SuperAdmin] Failed to record metric:', error.message);
  }
}

/**
 * ダッシュボード統計を取得
 */
export async function getDashboardStats() {
  const supabase = createAdminClient();
  if (!supabase) {
    return null;
  }

  // ユーザー総数
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // ワークスペース総数
  const { count: totalWorkspaces } = await supabase
    .from('workspaces')
    .select('*', { count: 'exact', head: true });

  // 今週の新規登録（過去7日間）
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: newSignupsWeek } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString());

  // セキュリティアラート数（criticalまたはwarning、過去24時間）
  const dayAgo = new Date();
  dayAgo.setDate(dayAgo.getDate() - 1);
  const { count: securityAlerts } = await supabase
    .from('security_logs')
    .select('*', { count: 'exact', head: true })
    .in('severity', ['warning', 'critical'])
    .gte('created_at', dayAgo.toISOString());

  return {
    total_users: totalUsers || 0,
    active_users_today: 0, // TODO: セッション追跡で実装
    total_workspaces: totalWorkspaces || 0,
    new_signups_week: newSignupsWeek || 0,
    security_alerts: securityAlerts || 0,
    storage_used_gb: 0, // TODO: ストレージ使用量追跡で実装
  };
}
