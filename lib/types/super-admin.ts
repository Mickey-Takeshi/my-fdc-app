/**
 * lib/types/super-admin.ts
 *
 * Phase 19: Super Admin 型定義
 */

// アカウントタイプ
export type AccountType = 'SA' | 'ADMIN' | 'MEMBER';

// テナント（ワークスペース）サマリー
export interface TenantSummary {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string;
  owner_name: string;
  member_count: number;
  created_at: string;
  is_active: boolean;
}

// ユーザーサマリー
export interface UserSummary {
  id: string;
  email: string;
  name: string;
  account_type: AccountType;
  workspace_count: number;
  last_login_at: string | null;
  is_suspended: boolean;
  created_at: string;
}

// システムメトリクス
export interface SystemMetric {
  id: string;
  metric_type: string;
  metric_value: number;
  metadata: Record<string, unknown>;
  recorded_at: string;
  created_at: string;
}

// メトリクスタイプ
export type MetricType =
  | 'active_users'
  | 'total_users'
  | 'total_workspaces'
  | 'api_calls'
  | 'storage_usage'
  | 'daily_signups';

// セキュリティログ
export interface SecurityLog {
  id: string;
  event_type: string;
  user_id: string | null;
  user_email?: string;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown>;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
}

// セキュリティイベントタイプ
export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_reset'
  | 'permission_denied'
  | 'suspicious_activity'
  | 'account_locked'
  | 'admin_action';

// ダッシュボード統計
export interface SADashboardStats {
  total_users: number;
  active_users_today: number;
  total_workspaces: number;
  new_signups_week: number;
  security_alerts: number;
  storage_used_gb: number;
}

// ユーザー操作
export interface UserAction {
  action: 'suspend' | 'unsuspend' | 'delete' | 'change_type';
  user_id: string;
  new_type?: AccountType;
  reason?: string;
}

// 代理ログインセッション
export interface ImpersonateSession {
  original_user_id: string;
  target_user_id: string;
  started_at: string;
  expires_at: string;
}
