/**
 * lib/types/workspace.ts
 *
 * ワークスペース関連の型定義
 * Phase 5: Workspace & ロール管理
 */

import { z } from 'zod';

// ========================================
// ロール定義
// ========================================

export const WorkspaceRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER']);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

// ========================================
// ワークスペース
// ========================================

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

// ========================================
// 権限チェック
// ========================================

/**
 * ロールの権限レベル
 * OWNER > ADMIN > MEMBER
 */
export const ROLE_LEVELS: Record<WorkspaceRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

/**
 * 指定したロール以上の権限を持っているか
 */
export function hasRoleOrAbove(
  currentRole: WorkspaceRole,
  requiredRole: WorkspaceRole
): boolean {
  return ROLE_LEVELS[currentRole] >= ROLE_LEVELS[requiredRole];
}

/**
 * OWNER かどうか
 */
export function isOwner(role: WorkspaceRole): boolean {
  return role === 'OWNER';
}

/**
 * ADMIN 以上かどうか
 */
export function isAdminOrAbove(role: WorkspaceRole): boolean {
  return hasRoleOrAbove(role, 'ADMIN');
}

// ========================================
// API リクエスト/レスポンス
// ========================================

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'ワークスペース名は必須です').max(100),
});

export type CreateWorkspaceRequest = z.infer<typeof CreateWorkspaceSchema>;

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type UpdateWorkspaceRequest = z.infer<typeof UpdateWorkspaceSchema>;

export const AddMemberSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  role: WorkspaceRoleSchema.default('MEMBER'),
});

export type AddMemberRequest = z.infer<typeof AddMemberSchema>;

export const UpdateMemberRoleSchema = z.object({
  role: WorkspaceRoleSchema,
});

export type UpdateMemberRoleRequest = z.infer<typeof UpdateMemberRoleSchema>;
