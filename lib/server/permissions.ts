/**
 * lib/server/permissions.ts
 *
 * ロールベース権限チェック（Phase 5）
 * RBAC: OWNER > ADMIN > MEMBER
 */

import { createServiceClient } from './supabase';
import { ROLE_HIERARCHY, type WorkspaceRole } from '@/lib/types/workspace';

/**
 * ユーザーのワークスペースロールを取得
 */
export async function getWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (!data) return null;

  return data.role as WorkspaceRole;
}

/**
 * ユーザーが指定ロール以上の権限を持つか確認
 * @returns ロール情報（権限あり）または null（権限なし）
 */
export async function requireRole(
  userId: string,
  workspaceId: string,
  minimumRole: WorkspaceRole
): Promise<WorkspaceRole | null> {
  const role = await getWorkspaceRole(userId, workspaceId);

  if (!role) return null;

  const userLevel = ROLE_HIERARCHY[role];
  const requiredLevel = ROLE_HIERARCHY[minimumRole];

  if (userLevel < requiredLevel) return null;

  return role;
}

/**
 * 操作別の権限チェック
 */
export const PERMISSIONS = {
  /** タスク作成・編集: 全ロール */
  canManageTasks: (role: WorkspaceRole): boolean =>
    ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.MEMBER,

  /** メンバー招待・削除: ADMIN 以上 */
  canManageMembers: (role: WorkspaceRole): boolean =>
    ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN,

  /** ワークスペース設定変更: ADMIN 以上 */
  canUpdateWorkspace: (role: WorkspaceRole): boolean =>
    ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN,

  /** ワークスペース削除: OWNER のみ */
  canDeleteWorkspace: (role: WorkspaceRole): boolean =>
    role === 'OWNER',

  /** OWNER 変更: OWNER のみ */
  canTransferOwnership: (role: WorkspaceRole): boolean =>
    role === 'OWNER',
} as const;
