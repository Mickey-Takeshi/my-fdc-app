# Phase 18: ワークスペース管理者機能

## 目標

ワークスペース管理者機能を実装（Phase 5 の RBAC を活用）：
- メンバー一覧・ロール表示
- 招待機能（メールでの招待）
- ロール変更（OWNER/ADMIN/MEMBER）
- 監査ログ

## 習得する新しい概念

- **ワークスペース管理**: メンバーの追加・削除・権限変更
- **招待トークン**: URL に埋め込む一時的な認証情報
- **監査ログ**: 誰がいつ何をしたかの操作履歴
- **権限チェック**: クライアント + サーバーの両方で検証

## 前提条件

- [ ] Phase 5 完了（RBAC 動作）
- [ ] workspace_members テーブルにロール情報がある

---

## Step 1: Supabase テーブル作成

### 1.1 invitations テーブル

Supabase SQL Editor で実行：

```sql
-- 招待テーブル
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 同じワークスペースに同じメールアドレスで未使用の招待は1つまで
  UNIQUE (workspace_id, email) WHERE accepted_at IS NULL
);

-- インデックス
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_workspace ON invitations(workspace_id);
CREATE INDEX idx_invitations_email ON invitations(email);

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- OWNER/ADMIN のみ閲覧可能
CREATE POLICY "invitations_select" ON invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = invitations.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- OWNER/ADMIN のみ作成可能
CREATE POLICY "invitations_insert" ON invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = invitations.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- OWNER/ADMIN のみ更新可能（承認処理用）
CREATE POLICY "invitations_update" ON invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = invitations.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- OWNER/ADMIN のみ削除可能
CREATE POLICY "invitations_delete" ON invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = invitations.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );
```

### 1.2 audit_logs テーブル

```sql
-- 監査ログテーブル
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- OWNER/ADMIN のみ閲覧可能
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = audit_logs.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- 挿入は server-side のみ（service_role key 使用）
-- アプリからの INSERT は許可しない（改ざん防止）
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT
  WITH CHECK (false);
```

### 確認ポイント

- [ ] invitations テーブルが作成された
- [ ] audit_logs テーブルが作成された
- [ ] RLS ポリシーが設定された
- [ ] インデックスが作成された

---

## Step 2: 型定義

### 2.1 lib/types/admin.ts

```typescript
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
```

### 確認ポイント

- [ ] lib/types/admin.ts が作成された
- [ ] Invitation 型が定義された
- [ ] AuditLog 型が定義された
- [ ] AuditAction 型が定義された

---

## Step 3: サーバーサイド処理

### 3.1 lib/server/admin.ts

```typescript
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
  AuditLog,
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

  // 既存メンバーチェック
  const { data: existingMember } = await supabaseAdmin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', (
      await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
    ).data?.id)
    .single();

  if (existingMember) {
    return { invitation: null, error: 'このユーザーは既にメンバーです' };
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

  // メールアドレスチェック（オプション：招待されたメールと一致するか）
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

  // OWNER の変更は不可（OWNER 権限の移譲は別の仕組みで）
  if (oldRole === 'owner') {
    return { success: false, error: 'オーナーのロールは変更できません' };
  }

  // OWNER には変更不可
  if (newRole === 'owner') {
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
  if (member.role === 'owner') {
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
```

### 確認ポイント

- [ ] lib/server/admin.ts が作成された
- [ ] checkUserRole 関数が実装された
- [ ] createInvitation 関数が実装された
- [ ] acceptInvitation 関数が実装された
- [ ] changeMemberRole 関数が実装された
- [ ] removeMember 関数が実装された
- [ ] recordAuditLog 関数が実装された
- [ ] getAuditLogs 関数が実装された

---

## Step 4: API エンドポイント

### 4.1 app/api/workspaces/[workspaceId]/invitations/route.ts

```typescript
/**
 * app/api/workspaces/[workspaceId]/invitations/route.ts
 *
 * Phase 18: 招待管理 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import {
  checkUserRole,
  createInvitation,
  getInvitations,
} from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ workspaceId: string }> };

// 招待一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 権限チェック
    const { allowed } = await checkUserRole(session.userId, workspaceId, ['owner', 'admin']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invitations = await getInvitations(workspaceId);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error in GET /api/workspaces/[workspaceId]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 招待作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 権限チェック
    const { allowed } = await checkUserRole(session.userId, workspaceId, ['owner', 'admin']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'email and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const { invitation, error } = await createInvitation(
      workspaceId,
      session.userId,
      { email, role }
    );

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/workspaces/[workspaceId]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.2 app/api/workspaces/[workspaceId]/invitations/[invitationId]/route.ts

```typescript
/**
 * app/api/workspaces/[workspaceId]/invitations/[invitationId]/route.ts
 *
 * Phase 18: 招待削除 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { checkUserRole, cancelInvitation } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ workspaceId: string; invitationId: string }>;
};

// 招待キャンセル
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, invitationId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 権限チェック
    const { allowed } = await checkUserRole(session.userId, workspaceId, ['owner', 'admin']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { success, error } = await cancelInvitation(
      invitationId,
      session.userId,
      workspaceId
    );

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/workspaces/[workspaceId]/invitations/[invitationId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.3 app/api/invitations/accept/route.ts

```typescript
/**
 * app/api/invitations/accept/route.ts
 *
 * Phase 18: 招待承認 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { acceptInvitation } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const { success, workspaceId, error } = await acceptInvitation(
      token,
      session.userId
    );

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, workspaceId });
  } catch (error) {
    console.error('Error in POST /api/invitations/accept:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.4 app/api/workspaces/[workspaceId]/members/[memberId]/route.ts

```typescript
/**
 * app/api/workspaces/[workspaceId]/members/[memberId]/route.ts
 *
 * Phase 18: メンバー管理 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { checkUserRole, changeMemberRole, removeMember } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ workspaceId: string; memberId: string }>;
};

// ロール変更
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, memberId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 権限チェック
    const { allowed } = await checkUserRole(session.userId, workspaceId, ['owner', 'admin']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { success, error } = await changeMemberRole(
      workspaceId,
      memberId,
      role,
      session.userId
    );

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/workspaces/[workspaceId]/members/[memberId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// メンバー削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, memberId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 権限チェック
    const { allowed } = await checkUserRole(session.userId, workspaceId, ['owner', 'admin']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { success, error } = await removeMember(
      workspaceId,
      memberId,
      session.userId
    );

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/workspaces/[workspaceId]/members/[memberId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.5 app/api/workspaces/[workspaceId]/audit-logs/route.ts

```typescript
/**
 * app/api/workspaces/[workspaceId]/audit-logs/route.ts
 *
 * Phase 18: 監査ログ API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { checkUserRole, getAuditLogs } from '@/lib/server/admin';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ workspaceId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const sessionToken = request.cookies.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 権限チェック
    const { allowed } = await checkUserRole(session.userId, workspaceId, ['owner', 'admin']);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { logs, total } = await getAuditLogs(workspaceId, limit, offset);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error('Error in GET /api/workspaces/[workspaceId]/audit-logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 確認ポイント

- [ ] app/api/workspaces/[workspaceId]/invitations/route.ts が作成された
- [ ] app/api/workspaces/[workspaceId]/invitations/[invitationId]/route.ts が作成された
- [ ] app/api/invitations/accept/route.ts が作成された
- [ ] app/api/workspaces/[workspaceId]/members/[memberId]/route.ts が作成された
- [ ] app/api/workspaces/[workspaceId]/audit-logs/route.ts が作成された

---

## Step 5: Context（状態管理）

### 5.1 lib/contexts/AdminContext.tsx

```typescript
/**
 * lib/contexts/AdminContext.tsx
 *
 * Phase 18: ワークスペース管理者機能の状態管理
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useWorkspace } from './WorkspaceContext';
import {
  Invitation,
  InvitationWithCreator,
  AuditLogWithUser,
  CreateInvitationRequest,
} from '@/lib/types/admin';
import { WorkspaceMember, WorkspaceRole } from '@/lib/types/workspace';

interface AdminContextValue {
  // 状態
  invitations: InvitationWithCreator[];
  auditLogs: AuditLogWithUser[];
  auditLogsTotal: number;
  loading: boolean;
  error: string | null;

  // 招待操作
  sendInvitation: (request: CreateInvitationRequest) => Promise<{ success: boolean; error?: string }>;
  cancelInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  getInviteUrl: (token: string) => string;

  // メンバー操作
  changeMemberRole: (memberId: string, newRole: WorkspaceRole) => Promise<{ success: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;

  // 監査ログ
  loadMoreAuditLogs: () => Promise<void>;

  // 再読み込み
  reloadInvitations: () => Promise<void>;
  reloadAuditLogs: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { workspace, role, reloadMembers } = useWorkspace();
  const [invitations, setInvitations] = useState<InvitationWithCreator[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogWithUser[]>([]);
  const [auditLogsTotal, setAuditLogsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = workspace?.id;
  const isAdmin = role === 'owner' || role === 'admin';

  // 招待一覧を読み込み
  const reloadInvitations = useCallback(async () => {
    if (!workspaceId || !isAdmin) return;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations);
      }
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  }, [workspaceId, isAdmin]);

  // 監査ログを読み込み
  const reloadAuditLogs = useCallback(async () => {
    if (!workspaceId || !isAdmin) return;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/audit-logs?limit=50&offset=0`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs);
        setAuditLogsTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  }, [workspaceId, isAdmin]);

  // 初期読み込み
  useEffect(() => {
    if (!workspaceId || !isAdmin) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      await Promise.all([reloadInvitations(), reloadAuditLogs()]);

      setLoading(false);
    };

    loadData();
  }, [workspaceId, isAdmin, reloadInvitations, reloadAuditLogs]);

  // 招待を送信
  const sendInvitation = useCallback(
    async (request: CreateInvitationRequest) => {
      if (!workspaceId) {
        return { success: false, error: 'ワークスペースが選択されていません' };
      }

      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error };
        }

        await reloadInvitations();
        return { success: true };
      } catch (err) {
        console.error('Failed to send invitation:', err);
        return { success: false, error: '招待の送信に失敗しました' };
      }
    },
    [workspaceId, reloadInvitations]
  );

  // 招待をキャンセル
  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      if (!workspaceId) {
        return { success: false, error: 'ワークスペースが選択されていません' };
      }

      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/invitations/${invitationId}`,
          { method: 'DELETE' }
        );

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error };
        }

        await reloadInvitations();
        return { success: true };
      } catch (err) {
        console.error('Failed to cancel invitation:', err);
        return { success: false, error: '招待のキャンセルに失敗しました' };
      }
    },
    [workspaceId, reloadInvitations]
  );

  // 招待 URL を取得
  const getInviteUrl = useCallback((token: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/invite/${token}`;
  }, []);

  // メンバーのロールを変更
  const changeMemberRole = useCallback(
    async (memberId: string, newRole: WorkspaceRole) => {
      if (!workspaceId) {
        return { success: false, error: 'ワークスペースが選択されていません' };
      }

      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/members/${memberId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error };
        }

        await reloadMembers();
        await reloadAuditLogs();
        return { success: true };
      } catch (err) {
        console.error('Failed to change role:', err);
        return { success: false, error: 'ロールの変更に失敗しました' };
      }
    },
    [workspaceId, reloadMembers, reloadAuditLogs]
  );

  // メンバーを削除
  const removeMember = useCallback(
    async (memberId: string) => {
      if (!workspaceId) {
        return { success: false, error: 'ワークスペースが選択されていません' };
      }

      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/members/${memberId}`,
          { method: 'DELETE' }
        );

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error };
        }

        await reloadMembers();
        await reloadAuditLogs();
        return { success: true };
      } catch (err) {
        console.error('Failed to remove member:', err);
        return { success: false, error: 'メンバーの削除に失敗しました' };
      }
    },
    [workspaceId, reloadMembers, reloadAuditLogs]
  );

  // 監査ログを追加読み込み
  const loadMoreAuditLogs = useCallback(async () => {
    if (!workspaceId || !isAdmin) return;

    try {
      const offset = auditLogs.length;
      const response = await fetch(
        `/api/workspaces/${workspaceId}/audit-logs?limit=50&offset=${offset}`
      );
      if (response.ok) {
        const data = await response.json();
        setAuditLogs((prev) => [...prev, ...data.logs]);
        setAuditLogsTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to load more audit logs:', err);
    }
  }, [workspaceId, isAdmin, auditLogs.length]);

  return (
    <AdminContext.Provider
      value={{
        invitations,
        auditLogs,
        auditLogsTotal,
        loading,
        error,
        sendInvitation,
        cancelInvitation,
        getInviteUrl,
        changeMemberRole,
        removeMember,
        loadMoreAuditLogs,
        reloadInvitations,
        reloadAuditLogs,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
```

### 確認ポイント

- [ ] lib/contexts/AdminContext.tsx が作成された
- [ ] sendInvitation 関数が実装された
- [ ] cancelInvitation 関数が実装された
- [ ] changeMemberRole 関数が実装された
- [ ] removeMember 関数が実装された
- [ ] getAuditLogs 関連の機能が実装された

---

## Step 6: UI コンポーネント

### 6.1 app/_components/admin/index.ts

```typescript
/**
 * app/_components/admin/index.ts
 *
 * Phase 18: Admin コンポーネントのエクスポート
 */

export { MembersSection } from './MembersSection';
export { InvitationsSection } from './InvitationsSection';
export { AuditLogsSection } from './AuditLogsSection';
export { RoleBadge } from './RoleBadge';
export { InviteForm } from './InviteForm';
```

### 6.2 app/_components/admin/RoleBadge.tsx

```typescript
/**
 * app/_components/admin/RoleBadge.tsx
 *
 * Phase 18: ロールバッジコンポーネント
 */

'use client';

import { WorkspaceRole } from '@/lib/types/workspace';

interface RoleBadgeProps {
  role: WorkspaceRole;
}

const roleConfig: Record<WorkspaceRole, { label: string; color: string; bg: string }> = {
  owner: { label: 'オーナー', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
  admin: { label: '管理者', color: 'var(--primary)', bg: 'rgba(59, 130, 246, 0.1)' },
  member: { label: 'メンバー', color: 'var(--text-light)', bg: 'rgba(107, 114, 128, 0.1)' },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: '12px',
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bg,
        borderRadius: '4px',
      }}
    >
      {config.label}
    </span>
  );
}
```

### 6.3 app/_components/admin/InviteForm.tsx

```typescript
/**
 * app/_components/admin/InviteForm.tsx
 *
 * Phase 18: 招待フォームコンポーネント
 */

'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useAdmin } from '@/lib/contexts/AdminContext';
import { WorkspaceRole } from '@/lib/types/workspace';

export function InviteForm() {
  const { sendInvitation } = useAdmin();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<WorkspaceRole, 'owner'>>('member');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSending(true);

    const result = await sendInvitation({ email, role });

    if (result.success) {
      setSuccess(true);
      setEmail('');
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || '招待の送信に失敗しました');
    }

    setSending(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          required
          style={{
            flex: '1 1 200px',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
          }}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Exclude<WorkspaceRole, 'owner'>)}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
          }}
        >
          <option value="member">メンバー</option>
          <option value="admin">管理者</option>
        </select>

        <button
          type="submit"
          disabled={sending || !email}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#fff',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: '6px',
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: sending ? 0.7 : 1,
          }}
        >
          <Send size={16} />
          {sending ? '送信中...' : '招待を送信'}
        </button>
      </div>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '14px', marginTop: '8px' }}>
          {error}
        </p>
      )}

      {success && (
        <p style={{ color: 'var(--success)', fontSize: '14px', marginTop: '8px' }}>
          招待を送信しました
        </p>
      )}
    </form>
  );
}
```

### 6.4 app/_components/admin/MembersSection.tsx

```typescript
/**
 * app/_components/admin/MembersSection.tsx
 *
 * Phase 18: メンバー一覧セクション
 */

'use client';

import { useState } from 'react';
import { MoreVertical, UserMinus, Shield } from 'lucide-react';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { useAdmin } from '@/lib/contexts/AdminContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { RoleBadge } from './RoleBadge';
import { WorkspaceRole } from '@/lib/types/workspace';

export function MembersSection() {
  const { members, role: myRole } = useWorkspace();
  const { changeMemberRole, removeMember } = useAdmin();
  const { user } = useAuth();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const canManage = myRole === 'owner' || myRole === 'admin';

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    setProcessing(memberId);
    await changeMemberRole(memberId, newRole);
    setProcessing(null);
    setOpenMenuId(null);
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('このメンバーを削除しますか？')) return;
    setProcessing(memberId);
    await removeMember(memberId);
    setProcessing(null);
    setOpenMenuId(null);
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
        メンバー ({members.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {members.map((member) => {
          const isMe = member.userId === user?.id;
          const isOwner = member.role === 'owner';
          const canEdit = canManage && !isMe && !isOwner;

          return (
            <div
              key={member.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'var(--bg)',
                borderRadius: '6px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {member.user.name || member.user.email}
                    {isMe && (
                      <span style={{ color: 'var(--text-light)', marginLeft: '8px' }}>
                        (あなた)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                    {member.user.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <RoleBadge role={member.role} />

                {canEdit && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === member.userId ? null : member.userId)}
                      disabled={processing === member.userId}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'var(--text-light)',
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuId === member.userId && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          marginTop: '4px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          minWidth: '160px',
                          zIndex: 10,
                        }}
                      >
                        <button
                          onClick={() =>
                            handleRoleChange(
                              member.userId,
                              member.role === 'admin' ? 'member' : 'admin'
                            )
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px 14px',
                            fontSize: '14px',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text)',
                          }}
                        >
                          <Shield size={16} />
                          {member.role === 'admin' ? 'メンバーに変更' : '管理者に変更'}
                        </button>
                        <button
                          onClick={() => handleRemove(member.userId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px 14px',
                            fontSize: '14px',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--danger)',
                          }}
                        >
                          <UserMinus size={16} />
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 6.5 app/_components/admin/InvitationsSection.tsx

```typescript
/**
 * app/_components/admin/InvitationsSection.tsx
 *
 * Phase 18: 招待管理セクション
 */

'use client';

import { useState } from 'react';
import { Copy, X, Clock, Check } from 'lucide-react';
import { useAdmin } from '@/lib/contexts/AdminContext';
import { RoleBadge } from './RoleBadge';
import { InviteForm } from './InviteForm';
import { WorkspaceRole } from '@/lib/types/workspace';

export function InvitationsSection() {
  const { invitations, cancelInvitation, getInviteUrl } = useAdmin();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleCopy = async (token: string, id: string) => {
    const url = getInviteUrl(token);
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancel = async (invitationId: string) => {
    if (!confirm('この招待をキャンセルしますか？')) return;
    setCancelling(invitationId);
    await cancelInvitation(invitationId);
    setCancelling(null);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const formatExpiry = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '期限切れ';
    if (diffDays === 0) return '今日まで';
    if (diffDays === 1) return '明日まで';
    return `${diffDays}日後まで`;
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
        メンバーを招待
      </h3>

      <InviteForm />

      {invitations.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 500, color: 'var(--text-light)' }}>
            保留中の招待 ({invitations.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'var(--bg)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  opacity: isExpired(invitation.expiresAt) ? 0.5 : 1,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{invitation.email}</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--text-light)',
                      marginTop: '4px',
                    }}
                  >
                    <RoleBadge role={invitation.role as WorkspaceRole} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {formatExpiry(invitation.expiresAt)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleCopy(invitation.token, invitation.id)}
                    disabled={isExpired(invitation.expiresAt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      fontSize: '13px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: copiedId === invitation.id ? 'var(--success)' : 'var(--text)',
                    }}
                  >
                    {copiedId === invitation.id ? (
                      <>
                        <Check size={14} />
                        コピー済み
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        URLをコピー
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCancel(invitation.id)}
                    disabled={cancelling === invitation.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: 'var(--danger)',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 6.6 app/_components/admin/AuditLogsSection.tsx

```typescript
/**
 * app/_components/admin/AuditLogsSection.tsx
 *
 * Phase 18: 監査ログセクション
 */

'use client';

import {
  Mail,
  UserPlus,
  UserMinus,
  Shield,
  Settings,
  XCircle,
} from 'lucide-react';
import { useAdmin } from '@/lib/contexts/AdminContext';
import { AuditAction } from '@/lib/types/admin';

const actionConfig: Record<
  AuditAction,
  { icon: React.ReactNode; label: string; color: string }
> = {
  invitation_sent: {
    icon: <Mail size={16} />,
    label: '招待を送信',
    color: 'var(--primary)',
  },
  invitation_accepted: {
    icon: <UserPlus size={16} />,
    label: '招待を承認',
    color: 'var(--success)',
  },
  invitation_cancelled: {
    icon: <XCircle size={16} />,
    label: '招待をキャンセル',
    color: 'var(--warning)',
  },
  member_role_changed: {
    icon: <Shield size={16} />,
    label: 'ロールを変更',
    color: 'var(--primary)',
  },
  member_removed: {
    icon: <UserMinus size={16} />,
    label: 'メンバーを削除',
    color: 'var(--danger)',
  },
  workspace_updated: {
    icon: <Settings size={16} />,
    label: 'ワークスペースを更新',
    color: 'var(--text-light)',
  },
};

export function AuditLogsSection() {
  const { auditLogs, auditLogsTotal, loadMoreAuditLogs } = useAdmin();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionDetails = (action: AuditAction, details: Record<string, unknown>) => {
    switch (action) {
      case 'invitation_sent':
        return `${details.email} を ${details.role} として招待`;
      case 'invitation_accepted':
        return `${details.email} が招待を承認`;
      case 'invitation_cancelled':
        return `${details.email} への招待をキャンセル`;
      case 'member_role_changed':
        return `${details.memberEmail} のロールを ${details.oldRole} から ${details.newRole} に変更`;
      case 'member_removed':
        return `${details.memberEmail} (${details.role}) を削除`;
      case 'workspace_updated':
        return 'ワークスペース設定を更新';
      default:
        return '';
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
        操作履歴
      </h3>

      {auditLogs.length === 0 ? (
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
          操作履歴はありません
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {auditLogs.map((log) => {
              const config = actionConfig[log.action as AuditAction];

              return (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg)',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: `${config.color}20`,
                      color: config.color,
                      flexShrink: 0,
                    }}
                  >
                    {config.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{config.label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                      {getActionDetails(log.action as AuditAction, log.details)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      実行者: {log.user?.name || log.user?.email || '不明'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {auditLogs.length < auditLogsTotal && (
            <button
              onClick={loadMoreAuditLogs}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                marginTop: '16px',
                fontSize: '14px',
                color: 'var(--primary)',
                background: 'transparent',
                border: '1px solid var(--primary)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              もっと見る ({auditLogsTotal - auditLogs.length} 件)
            </button>
          )}
        </>
      )}
    </div>
  );
}
```

### 確認ポイント

- [ ] app/_components/admin/index.ts が作成された
- [ ] app/_components/admin/RoleBadge.tsx が作成された
- [ ] app/_components/admin/InviteForm.tsx が作成された
- [ ] app/_components/admin/MembersSection.tsx が作成された
- [ ] app/_components/admin/InvitationsSection.tsx が作成された
- [ ] app/_components/admin/AuditLogsSection.tsx が作成された

---

## Step 7: 管理者ページ

### 7.1 app/(app)/admin/page.tsx

```typescript
/**
 * app/(app)/admin/page.tsx
 *
 * Phase 18: ワークスペース管理者ページ
 */

'use client';

import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { AdminProvider } from '@/lib/contexts/AdminContext';
import {
  MembersSection,
  InvitationsSection,
  AuditLogsSection,
} from '@/app/_components/admin';
import { AlertTriangle } from 'lucide-react';

function AdminPageContent() {
  const { workspace, role, loading } = useWorkspace();

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
        読み込み中...
      </div>
    );
  }

  if (!workspace) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
        ワークスペースを選択してください
      </div>
    );
  }

  // 権限チェック（クライアント側）
  if (role !== 'owner' && role !== 'admin') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center',
        }}
      >
        <AlertTriangle size={48} color="var(--warning)" />
        <h2 style={{ margin: '16px 0 8px' }}>アクセス権限がありません</h2>
        <p style={{ color: 'var(--text-light)' }}>
          このページはワークスペースのオーナーまたは管理者のみアクセスできます
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>ワークスペース管理</h1>
        <p style={{ color: 'var(--text-light)', margin: '8px 0 0' }}>
          {workspace.name} のメンバーと設定を管理します
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <InvitationsSection />
        <MembersSection />
        <AuditLogsSection />
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminProvider>
      <AdminPageContent />
    </AdminProvider>
  );
}
```

### 確認ポイント

- [ ] app/(app)/admin/page.tsx が作成された
- [ ] 権限チェックが実装された
- [ ] AdminProvider でラップされている

---

## Step 8: 招待承認ページ

### 8.1 app/invite/[token]/page.tsx

```typescript
/**
 * app/invite/[token]/page.tsx
 *
 * Phase 18: 招待承認ページ
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const token = params.token as string;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // 未ログインの場合はログインページへ（招待トークンを保持）
      router.push(`/login?invite=${token}`);
      return;
    }

    // 招待を承認
    const acceptInvite = async () => {
      try {
        const response = await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error);
          setStatus('error');
          return;
        }

        setStatus('success');

        // 3秒後にダッシュボードへ
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (err) {
        console.error('Failed to accept invitation:', err);
        setError('招待の承認に失敗しました');
        setStatus('error');
      }
    };

    acceptInvite();
  }, [user, authLoading, token, router]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      {status === 'loading' && (
        <>
          <Loader size={48} className="animate-spin" color="var(--primary)" />
          <h2 style={{ margin: '16px 0 8px' }}>招待を処理しています...</h2>
          <p style={{ color: 'var(--text-light)' }}>しばらくお待ちください</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle size={48} color="var(--success)" />
          <h2 style={{ margin: '16px 0 8px' }}>招待を承認しました</h2>
          <p style={{ color: 'var(--text-light)' }}>
            ダッシュボードに移動します...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle size={48} color="var(--danger)" />
          <h2 style={{ margin: '16px 0 8px' }}>招待の承認に失敗しました</h2>
          <p style={{ color: 'var(--text-light)' }}>{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              marginTop: '24px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ダッシュボードへ
          </button>
        </>
      )}
    </div>
  );
}
```

### 確認ポイント

- [ ] app/invite/[token]/page.tsx が作成された
- [ ] 未ログイン時にログインページへリダイレクトされる
- [ ] 招待承認後にダッシュボードへ移動する

---

## Step 9: ナビゲーション追加

### 9.1 サイドバーに管理者メニューを追加

`app/(app)/layout.tsx` のサイドバーに以下を追加:

```typescript
// インポート追加
import { Settings } from 'lucide-react';

// ナビゲーション配列に追加（roleがowner/adminの場合のみ表示）
{
  role && ['owner', 'admin'].includes(role) && (
    <NavLink href="/admin" icon={<Settings size={20} />}>
      管理
    </NavLink>
  )
}
```

### 確認ポイント

- [ ] サイドバーに「管理」リンクが追加された
- [ ] OWNER/ADMIN のみ表示される

---

## Step 10: middleware 更新

### 10.1 middleware.ts

招待ページを認証から除外（ただしAPI経由で認証チェック）:

```typescript
// 除外パスに追加
const publicPaths = ['/login', '/api/auth'];

// 招待ページは特別扱い（ページ自体は表示するがAPI呼び出し時に認証チェック）
const semiPublicPaths = ['/invite'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Semi-public paths（招待ページなど）
  if (semiPublicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // ... 既存の認証チェック
}
```

### 確認ポイント

- [ ] /invite/[token] ページにアクセスできる
- [ ] 認証なしでも招待ページは表示される（API呼び出し時に認証チェック）

---

## 完了チェックリスト

### データベース
- [ ] invitations テーブルが作成された
- [ ] audit_logs テーブルが作成された
- [ ] RLS ポリシーが設定された

### 型定義
- [ ] lib/types/admin.ts が作成された
- [ ] Invitation, AuditLog, AuditAction 型が定義された

### サーバーサイド
- [ ] lib/server/admin.ts が作成された
- [ ] 権限チェック機能が実装された
- [ ] 招待 CRUD が実装された
- [ ] メンバー管理機能が実装された
- [ ] 監査ログ記録・取得が実装された

### API
- [ ] /api/workspaces/[workspaceId]/invitations が作成された
- [ ] /api/workspaces/[workspaceId]/invitations/[invitationId] が作成された
- [ ] /api/invitations/accept が作成された
- [ ] /api/workspaces/[workspaceId]/members/[memberId] が作成された
- [ ] /api/workspaces/[workspaceId]/audit-logs が作成された

### Context
- [ ] lib/contexts/AdminContext.tsx が作成された

### UI
- [ ] app/_components/admin/RoleBadge.tsx が作成された
- [ ] app/_components/admin/InviteForm.tsx が作成された
- [ ] app/_components/admin/MembersSection.tsx が作成された
- [ ] app/_components/admin/InvitationsSection.tsx が作成された
- [ ] app/_components/admin/AuditLogsSection.tsx が作成された

### ページ
- [ ] app/(app)/admin/page.tsx が作成された
- [ ] app/invite/[token]/page.tsx が作成された

### ナビゲーション
- [ ] サイドバーに管理メニューが追加された
- [ ] OWNER/ADMIN のみ表示される

### 機能テスト
- [ ] メンバー一覧が表示される
- [ ] 招待フォームが動作する
- [ ] 招待 URL をコピーできる
- [ ] 招待をキャンセルできる
- [ ] 招待 URL からメンバーが参加できる
- [ ] メンバーのロールを変更できる
- [ ] メンバーを削除できる
- [ ] 監査ログが表示される
- [ ] 権限のないユーザーはアクセス拒否される

---

## トラブルシューティング

### 招待が作成できない

1. RLS ポリシーを確認
2. ユーザーが OWNER/ADMIN か確認
3. Service Role Key が正しいか確認

### 監査ログが記録されない

1. Service Role Key が設定されているか確認
2. audit_logs テーブルの INSERT ポリシーを確認（サーバーサイドのみ許可）

### 招待承認時にエラー

1. トークンが有効期限内か確認
2. メールアドレスが一致するか確認
3. 既にメンバーでないか確認

### 権限チェックが機能しない

1. workspace_members テーブルのロールを確認
2. サーバーサイドとクライアントサイドの両方でチェックしているか確認
