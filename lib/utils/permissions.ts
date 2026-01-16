/**
 * lib/utils/permissions.ts
 *
 * 権限チェックユーティリティ
 * Phase 5: Workspace & ロール管理
 */

import type { WorkspaceRole } from '@/lib/types/workspace';

// ========================================
// システムロール
// ========================================

export type SystemRole = 'SA' | 'USER' | 'TEST';

/**
 * システム管理者かどうか
 */
export function isSA(role: SystemRole | string | undefined | null): boolean {
  return role === 'SA';
}

/**
 * システムロールを取得
 */
export function getAccountType(
  role: string | undefined | null
): SystemRole {
  if (role === 'SA') return 'SA';
  if (role === 'USER') return 'USER';
  return 'TEST';
}

// ========================================
// ワークスペースロール
// ========================================

/**
 * ワークスペースの OWNER かどうか
 */
export function isWorkspaceOwner(role: WorkspaceRole | null): boolean {
  return role === 'OWNER';
}

/**
 * ワークスペースの ADMIN 以上かどうか
 */
export function isWorkspaceAdmin(role: WorkspaceRole | null): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * メンバー管理が可能かどうか（ADMIN 以上）
 */
export function canManageMembers(role: WorkspaceRole | null): boolean {
  return isWorkspaceAdmin(role);
}

/**
 * 設定変更が可能かどうか（ADMIN 以上）
 */
export function canManageSettings(role: WorkspaceRole | null): boolean {
  return isWorkspaceAdmin(role);
}

/**
 * ワークスペース削除が可能かどうか（OWNER のみ）
 */
export function canDeleteWorkspace(role: WorkspaceRole | null): boolean {
  return isWorkspaceOwner(role);
}

/**
 * ロール変更が可能かどうか
 * - OWNER は全員のロールを変更可能
 * - ADMIN は MEMBER のロールのみ変更可能
 */
export function canChangeRole(
  currentUserRole: WorkspaceRole | null,
  targetRole: WorkspaceRole
): boolean {
  if (!currentUserRole) return false;
  if (currentUserRole === 'OWNER') return true;
  if (currentUserRole === 'ADMIN' && targetRole === 'MEMBER') return true;
  return false;
}
