/**
 * lib/server/admin.ts
 *
 * Phase 18: ワークスペース管理者機能のサーバーサイド処理
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import {
  Invitation,
  InvitationWithCreator,
  AuditLogWithUser,
  AuditAction,
  CreateInvitationRequest,
} from '@/lib/types/admin';
import { WorkspaceRole } from '@/lib/types/workspace';

// Service Role クライアント（RLS をバイパス）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ユーザーの権限をチェック
 */
export async function checkUserRole(
  userId: string,
  workspaceId: string,
  requiredRoles: WorkspaceRole[]
): Promise<{ allowed: boolean; currentRole: WorkspaceRole | null }> {
  const { data, error } = await supabaseAdmin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { allowed: false, currentRole: null };
  }

  const currentRole = data.role as WorkspaceRole;
  return {
    allowed: requiredRoles.includes(currentRole),
    currentRole,
  };
}

/**
 * 招待トークンを生成
 */
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 招待を作成
 */
export async function createInvitation(
  workspaceId: string,
  createdBy: string,
  request: CreateInvitationRequest
): Promise<{ invitation: Invitation | null; error: string | null }> {
  const { email, role } = request;

  // メールアドレスでユーザーを検索
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  // 既存メンバーチェック（ユーザーが存在する場合のみ）
  if (existingUser) {
    const { data: existingMember } = await supabaseAdmin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', existingUser.id)
      .single();

    if (existingMember) {
      return { invitation: null, error: 'このユーザーは既にメンバーです' };
    }
  }

  // 既存の未使用招待チェック
  const { data: existingInvitation } = await supabaseAdmin
    .from('invitations')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('email', email)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (existingInvitation) {
    return { invitation: null, error: 'このメールアドレスには既に有効な招待があります' };
  }

  // 招待を作成
  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7日間有効

  const { data, error } = await supabaseAdmin
    .from('invitations')
    .insert({
      workspace_id: workspaceId,
      email,
      role,
      token,
      expires_at: expiresAt.toISOString(),
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create invitation:', error);
    return { invitation: null, error: '招待の作成に失敗しました' };
  }

  // 監査ログを記録
  await recordAuditLog(workspaceId, createdBy, 'invitation_sent', {
    invitationId: data.id,
    email,
    role,
  });

  return {
    invitation: {
      id: data.id,
      workspaceId: data.workspace_id,
      email: data.email,
      role: data.role,
      token: data.token,
      expiresAt: data.expires_at,
      createdBy: data.created_by,
      acceptedAt: data.accepted_at,
      createdAt: data.created_at,
    },
    error: null,
  };
}

/**
 * 招待一覧を取得
 */
export async function getInvitations(
  workspaceId: string
): Promise<InvitationWithCreator[]> {
  const { data, error } = await supabaseAdmin
    .from('invitations')
    .select(`
      *,
      creator:users!invitations_created_by_fkey (
        id,
        email,
        name
      )
    `)
    .eq('workspace_id', workspaceId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get invitations:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    workspaceId: item.workspace_id,
    email: item.email,
    role: item.role,
    token: item.token,
    expiresAt: item.expires_at,
    createdBy: item.created_by,
    acceptedAt: item.accepted_at,
    createdAt: item.created_at,
    creator: item.creator,
  }));
}

/**
 * 招待をキャンセル
 */
export async function cancelInvitation(
  invitationId: string,
  userId: string,
  workspaceId: string
): Promise<{ success: boolean; error: string | null }> {
  const { data: invitation, error: fetchError } = await supabaseAdmin
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId)
    .single();

  if (fetchError || !invitation) {
    return { success: false, error: '招待が見つかりません' };
  }

  const { error } = await supabaseAdmin
    .from('invitations')
    .delete()
    .eq('id', invitationId);

  if (error) {
    console.error('Failed to cancel invitation:', error);
    return { success: false, error: '招待のキャンセルに失敗しました' };
  }

  // 監査ログを記録
  await recordAuditLog(workspaceId, userId, 'invitation_cancelled', {
    invitationId,
    email: invitation.email,
  });

  return { success: true, error: null };
}

/**
 * 招待を承認（トークンで）
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; workspaceId: string | null; error: string | null }> {
  // 招待を検索
  const { data: invitation, error: fetchError } = await supabaseAdmin
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .single();

  if (fetchError || !invitation) {
    return { success: false, workspaceId: null, error: '招待が見つかりません' };
  }

  // 有効期限チェック
  if (new Date(invitation.expires_at) < new Date()) {
    return { success: false, workspaceId: null, error: '招待の有効期限が切れています' };
  }

  // ユーザーのメールアドレスを取得
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  // メールアドレスチェック（招待されたメールと一致するか）
  if (user?.email !== invitation.email) {
    return {
      success: false,
      workspaceId: null,
      error: '招待されたメールアドレスでログインしてください',
    };
  }

  // 既にメンバーかチェック
  const { data: existingMember } = await supabaseAdmin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', invitation.workspace_id)
    .eq('user_id', userId)
    .single();

  if (existingMember) {
    // 既にメンバーの場合は招待を承認済みにして終了
    await supabaseAdmin
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    return {
      success: true,
      workspaceId: invitation.workspace_id,
      error: null,
    };
  }

  // メンバーとして追加
  const { error: memberError } = await supabaseAdmin
    .from('workspace_members')
    .insert({
      workspace_id: invitation.workspace_id,
      user_id: userId,
      role: invitation.role,
    });

  if (memberError) {
    console.error('Failed to add member:', memberError);
    return { success: false, workspaceId: null, error: 'メンバーの追加に失敗しました' };
  }

  // 招待を承認済みに
  await supabaseAdmin
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id);

  // 監査ログを記録
  await recordAuditLog(invitation.workspace_id, userId, 'invitation_accepted', {
    invitationId: invitation.id,
    email: invitation.email,
    newMemberId: userId,
  });

  return {
    success: true,
    workspaceId: invitation.workspace_id,
    error: null,
  };
}

/**
 * メンバーのロールを変更
 */
export async function changeMemberRole(
  workspaceId: string,
  targetUserId: string,
  newRole: WorkspaceRole,
  actorId: string
): Promise<{ success: boolean; error: string | null }> {
  // 自分自身の変更は不可
  if (targetUserId === actorId) {
    return { success: false, error: '自分自身のロールは変更できません' };
  }

  // 現在のロールを取得
  const { data: member, error: fetchError } = await supabaseAdmin
    .from('workspace_members')
    .select(`
      role,
      user:users (
        email
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)
    .single();

  if (fetchError || !member) {
    return { success: false, error: 'メンバーが見つかりません' };
  }

  const oldRole = member.role;

  // OWNER の変更は不可
  if (oldRole === 'OWNER') {
    return { success: false, error: 'オーナーのロールは変更できません' };
  }

  // OWNER には変更不可
  if (newRole === 'OWNER') {
    return { success: false, error: 'オーナー権限の付与はできません' };
  }

  // ロールを更新
  const { error } = await supabaseAdmin
    .from('workspace_members')
    .update({ role: newRole })
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId);

  if (error) {
    console.error('Failed to change role:', error);
    return { success: false, error: 'ロールの変更に失敗しました' };
  }

  // 監査ログを記録
  await recordAuditLog(workspaceId, actorId, 'member_role_changed', {
    memberId: targetUserId,
    memberEmail: (member.user as any)?.email,
    oldRole,
    newRole,
  });

  return { success: true, error: null };
}

/**
 * メンバーを削除
 */
export async function removeMember(
  workspaceId: string,
  targetUserId: string,
  actorId: string
): Promise<{ success: boolean; error: string | null }> {
  // 自分自身の削除は不可
  if (targetUserId === actorId) {
    return { success: false, error: '自分自身を削除することはできません' };
  }

  // 現在のロールを取得
  const { data: member, error: fetchError } = await supabaseAdmin
    .from('workspace_members')
    .select(`
      role,
      user:users (
        email
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)
    .single();

  if (fetchError || !member) {
    return { success: false, error: 'メンバーが見つかりません' };
  }

  // OWNER の削除は不可
  if (member.role === 'OWNER') {
    return { success: false, error: 'オーナーを削除することはできません' };
  }

  // メンバーを削除
  const { error } = await supabaseAdmin
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId);

  if (error) {
    console.error('Failed to remove member:', error);
    return { success: false, error: 'メンバーの削除に失敗しました' };
  }

  // 監査ログを記録
  await recordAuditLog(workspaceId, actorId, 'member_removed', {
    memberId: targetUserId,
    memberEmail: (member.user as any)?.email,
    role: member.role,
  });

  return { success: true, error: null };
}

/**
 * 監査ログを記録（Service Role で RLS をバイパス）
 */
export async function recordAuditLog(
  workspaceId: string,
  userId: string,
  action: AuditAction,
  details: Record<string, unknown>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('audit_logs')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      action,
      details,
    });

  if (error) {
    console.error('Failed to record audit log:', error);
  }
}

/**
 * 監査ログを取得
 */
export async function getAuditLogs(
  workspaceId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ logs: AuditLogWithUser[]; total: number }> {
  // 総数を取得
  const { count } = await supabaseAdmin
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  // ログを取得
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select(`
      *,
      user:users (
        id,
        email,
        name
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to get audit logs:', error);
    return { logs: [], total: 0 };
  }

  return {
    logs: data.map((item: any) => ({
      id: item.id,
      workspaceId: item.workspace_id,
      userId: item.user_id,
      action: item.action,
      details: item.details,
      createdAt: item.created_at,
      user: item.user,
    })),
    total: count || 0,
  };
}
