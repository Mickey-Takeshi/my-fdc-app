/**
 * lib/types/admin.ts
 *
 * 管理者機能の型定義（Phase 18-19）
 * Workspace Admin + Super Admin
 */

/** 招待（アプリ用） */
export interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdBy: string;
  createdAt: string;
}

/** 招待 DB行 */
export interface InvitationRow {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_by: string;
  created_at: string;
}

/** DB行 → アプリ型変換 */
export function toInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    email: row.email,
    role: row.role as 'ADMIN' | 'MEMBER',
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

/** 監査ログ（アプリ用） */
export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
}

/** 監査ログ DB行 */
export interface AuditLogRow {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

/** DB行 → アプリ型変換 */
export function toAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    action: row.action,
    details: (row.details ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

/** テナントサマリ（SA用） */
export interface TenantSummary {
  workspaceId: string;
  workspaceName: string;
  ownerEmail: string;
  memberCount: number;
  createdAt: string;
}

/** システムメトリクス */
export interface SystemMetric {
  id: string;
  metricType: string;
  metricValue: number;
  metadata: Record<string, unknown>;
  recordedAt: string;
}

/** システムメトリクス DB行 */
export interface SystemMetricRow {
  id: string;
  metric_type: string;
  metric_value: number;
  metadata: Record<string, unknown> | null;
  recorded_at: string;
  created_at: string;
}

/** DB行 → アプリ型変換 */
export function toSystemMetric(row: SystemMetricRow): SystemMetric {
  return {
    id: row.id,
    metricType: row.metric_type,
    metricValue: Number(row.metric_value),
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    recordedAt: row.recorded_at,
  };
}

/** 監査ログアクション */
export type AuditAction =
  | 'invite_sent'
  | 'invite_accepted'
  | 'role_changed'
  | 'member_removed'
  | 'workspace_updated'
  | 'workspace_deleted';
