/**
 * app/api/workspaces/[id]/members/[userId]/route.ts
 *
 * 個別メンバー操作 API（Phase 5）
 * PUT    /api/workspaces/:id/members/:userId - ロール変更（ADMIN 以上、OWNER 変更は OWNER のみ）
 * DELETE /api/workspaces/:id/members/:userId - メンバー削除（ADMIN 以上）
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole, PERMISSIONS } from '@/lib/server/permissions';

const UpdateRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER'] as const),
});

type RouteParams = { params: Promise<{ id: string; userId: string }> };

/**
 * PUT /api/workspaces/:id/members/:userId
 * ロール変更（ADMIN 以上、OWNER 変更は OWNER のみ）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { id, userId } = await params;

  // 自分自身のロールは変更不可
  if (user.id === userId) {
    return NextResponse.json(
      { error: '自分自身のロールは変更できません' },
      { status: 400 }
    );
  }

  const callerRole = await requireRole(user.id, id, 'ADMIN');
  if (!callerRole || !PERMISSIONS.canManageMembers(callerRole)) {
    return NextResponse.json({ error: 'ADMIN 以上の権限が必要です' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'リクエストの形式が不正です' },
      { status: 400 }
    );
  }

  const result = UpdateRoleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { role: newRole } = result.data;

  // OWNER への変更は現在の OWNER のみ可能
  if (newRole === 'OWNER' && !PERMISSIONS.canTransferOwnership(callerRole)) {
    return NextResponse.json(
      { error: 'OWNER 権限の委譲は現在の OWNER のみ可能です' },
      { status: 403 }
    );
  }

  const supabase = createServiceClient();

  // 対象メンバーの存在確認
  const { data: targetMember } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', id)
    .eq('user_id', userId)
    .single();

  if (!targetMember) {
    return NextResponse.json(
      { error: 'メンバーが見つかりません' },
      { status: 404 }
    );
  }

  // OWNER を変更する場合、現在の OWNER を ADMIN に降格
  if (newRole === 'OWNER') {
    await supabase
      .from('workspace_members')
      .update({ role: 'ADMIN' })
      .eq('workspace_id', id)
      .eq('user_id', user.id);
  }

  // ロール更新
  const { error } = await supabase
    .from('workspace_members')
    .update({ role: newRole })
    .eq('workspace_id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'ロールの更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    member: { workspace_id: id, user_id: userId, role: newRole },
  });
}

/**
 * DELETE /api/workspaces/:id/members/:userId
 * メンバー削除（ADMIN 以上、OWNER は削除不可）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { id, userId } = await params;

  const callerRole = await requireRole(user.id, id, 'ADMIN');
  if (!callerRole || !PERMISSIONS.canManageMembers(callerRole)) {
    return NextResponse.json({ error: 'ADMIN 以上の権限が必要です' }, { status: 403 });
  }

  const supabase = createServiceClient();

  // 対象メンバーのロール確認
  const { data: targetMember } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', id)
    .eq('user_id', userId)
    .single();

  if (!targetMember) {
    return NextResponse.json(
      { error: 'メンバーが見つかりません' },
      { status: 404 }
    );
  }

  // OWNER は削除不可
  if (targetMember.role === 'OWNER') {
    return NextResponse.json(
      { error: 'OWNER は削除できません。先に OWNER を変更してください。' },
      { status: 400 }
    );
  }

  // メンバー削除
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Member deletion error:', error);
    return NextResponse.json(
      { error: 'メンバーの削除に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
