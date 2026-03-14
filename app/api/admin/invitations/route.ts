/**
 * app/api/admin/invitations/route.ts
 *
 * 招待管理 API（Phase 18）
 * GET  /api/admin/invitations?workspace_id=xxx
 * POST /api/admin/invitations - 招待作成
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import crypto from 'crypto';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toInvitation, type InvitationRow } from '@/lib/types/admin';

const CreateInvitationSchema = z.object({
  workspace_id: z.uuid(),
  email: z.email('有効なメールアドレスを入力してください'),
  role: z.enum(['ADMIN', 'MEMBER'] as const),
});

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const workspaceId = request.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id は必須です' }, { status: 400 });
  }

  const role = await requireRole(user.id, workspaceId, 'ADMIN');
  if (!role) {
    return NextResponse.json({ error: 'ADMIN以上の権限が必要です' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Invitations list error:', error);
    return NextResponse.json({ error: '招待の取得に失敗しました' }, { status: 500 });
  }

  const invitations = (data as InvitationRow[]).map(toInvitation);
  return NextResponse.json({ invitations });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が不正です' }, { status: 400 });
  }

  const result = CreateInvitationSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { workspace_id, email, role: inviteRole } = result.data;

  const adminRole = await requireRole(user.id, workspace_id, 'ADMIN');
  if (!adminRole) {
    return NextResponse.json({ error: 'ADMIN以上の権限が必要です' }, { status: 403 });
  }

  const supabase = createServiceClient();

  // 既存メンバーかチェック
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', existingUser.id)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: 'このユーザーは既にメンバーです' }, { status: 409 });
    }
  }

  // トークン生成
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7日後

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      workspace_id,
      email,
      role: inviteRole,
      token,
      expires_at: expiresAt,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Invitation create error:', error);
    return NextResponse.json({ error: '招待の作成に失敗しました' }, { status: 500 });
  }

  // 監査ログ
  await supabase.from('audit_logs').insert({
    workspace_id,
    user_id: user.id,
    action: 'invite_sent',
    details: { email, role: inviteRole },
  });

  return NextResponse.json(
    { invitation: toInvitation(data as InvitationRow) },
    { status: 201 }
  );
}
