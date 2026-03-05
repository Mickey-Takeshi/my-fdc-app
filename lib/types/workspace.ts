/**
 * lib/types/workspace.ts
 *
 * ワークスペース関連の型定義（Phase 5）
 */

/** ワークスペースロール */
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

/** ロール階層（数値が大きいほど権限が高い） */
export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

/** ワークスペース */
export interface Workspace {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/** ワークスペースメンバー */
export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
}

/** ワークスペースメンバー（ユーザー情報付き） */
export interface WorkspaceMemberWithUser extends WorkspaceMember {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/** ワークスペース一覧レスポンス */
export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}
