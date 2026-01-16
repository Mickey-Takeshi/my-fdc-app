/**
 * app/api/admin/sa/users/[userId]/route.ts
 *
 * Phase 19: ユーザー操作 API（停止/削除/タイプ変更）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireSuperAdmin, logSecurityEvent } from '@/lib/server/super-admin';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

// ユーザー情報を更新
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId: targetUserId } = await context.params;

  // SA 権限チェック
  const adminUserId = await requireSuperAdmin();
  if (!adminUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { action, new_type, reason } = body as {
    action: 'suspend' | 'unsuspend' | 'change_type';
    new_type?: string;
    reason?: string;
  };

  // 自分自身への操作を禁止
  if (targetUserId === adminUserId) {
    return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
  }

  let updateData: Record<string, unknown> = {};
  let eventType = '';

  switch (action) {
    case 'suspend':
      updateData = { is_suspended: true };
      eventType = 'user_suspended';
      break;
    case 'unsuspend':
      updateData = { is_suspended: false };
      eventType = 'user_unsuspended';
      break;
    case 'change_type':
      if (!new_type || !['SA', 'ADMIN', 'MEMBER'].includes(new_type)) {
        return NextResponse.json({ error: 'Invalid account type' }, { status: 400 });
      }
      updateData = { account_type: new_type };
      eventType = 'account_type_changed';
      break;
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', targetUserId);

  if (error) {
    console.error('[SA Users] Failed to update user:', error.message);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  // セキュリティログ記録
  await logSecurityEvent(
    eventType,
    adminUserId,
    {
      target_user_id: targetUserId,
      action,
      new_type,
      reason,
    },
    'info'
  );

  return NextResponse.json({ success: true });
}

// ユーザーを削除
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { userId: targetUserId } = await context.params;

  // SA 権限チェック
  const adminUserId = await requireSuperAdmin();
  if (!adminUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  // 自分自身の削除を禁止
  if (targetUserId === adminUserId) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  // ユーザー情報を取得（ログ用）
  const { data: targetUser } = await supabase
    .from('users')
    .select('email, account_type')
    .eq('id', targetUserId)
    .single();

  // 他の SA を削除することを禁止
  if (targetUser?.account_type === 'SA') {
    return NextResponse.json({ error: 'Cannot delete Super Admin account' }, { status: 400 });
  }

  // 関連データの削除（セッション、ワークスペースメンバーシップ）
  await supabase.from('sessions').delete().eq('user_id', targetUserId);
  await supabase.from('workspace_members').delete().eq('user_id', targetUserId);

  // ユーザー削除
  const { error } = await supabase.from('users').delete().eq('id', targetUserId);

  if (error) {
    console.error('[SA Users] Failed to delete user:', error.message);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }

  // セキュリティログ記録
  await logSecurityEvent(
    'user_deleted',
    adminUserId,
    {
      deleted_user_id: targetUserId,
      deleted_user_email: targetUser?.email,
    },
    'warning'
  );

  return NextResponse.json({ success: true });
}
