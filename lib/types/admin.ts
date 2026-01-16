/**
 * lib/types/admin.ts
 *
 * Phase 18: ワークスペース管理者機能の型定義
 */

import { WorkspaceRole } from './workspace';

/**
 * 招待ステータス
 */
export type InvitationStatus = 'pending' | 'accepted' | 'expired';

/**
 * 招待
 */
export interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  role: Exclude<WorkspaceRole, 'owner'>; // owner は招待できない
  token: string;
  expiresAt: string;
  createdBy: string;
  acceptedAt: string | null;
  createdAt: string;
}

/**
 * 招待（表示用・作成者情報付き）
 */
export interface InvitationWithCreator extends Invitation {
  creator: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * 招待作成リクエスト
 */
export interface CreateInvitationRequest {
  email: string;
  role: Exclude<WorkspaceRole, 'owner'>;
}

/**
 * 監査ログのアクション種別
 */
export type AuditAction =
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'invitation_cancelled'
  | 'member_role_changed'
  | 'member_removed'
  | 'workspace_updated';

/**
 * 監査ログ
 */
export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: AuditAction;
  details: Record<string, unknown>;
  createdAt: string;
}

/**
 * 監査ログ（表示用・ユーザー情報付き）
 */
export interface AuditLogWithUser extends AuditLog {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * 監査ログの詳細（各アクション別）
 */
export interface InvitationSentDetails {
  invitationId: string;
  email: string;
  role: string;
}

export interface InvitationAcceptedDetails {
  invitationId: string;
  email: string;
  newMemberId: string;
}

export interface InvitationCancelledDetails {
  invitationId: string;
  email: string;
}

export interface MemberRoleChangedDetails {
  memberId: string;
  memberEmail: string;
  oldRole: string;
  newRole: string;
}

export interface MemberRemovedDetails {
  memberId: string;
  memberEmail: string;
  role: string;
}

export interface WorkspaceUpdatedDetails {
  changes: Record<string, { old: unknown; new: unknown }>;
}
