/**
 * app/api/workspaces/[id]/members/route.ts
 *
 * メンバー一覧取得・追加 API（Phase 5）
 * GET  /api/workspaces/:id/members - メンバー一覧
 * POST /api/workspaces/:id/members - メンバー招待（ADMIN 以上）
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole, PERMISSIONS } from '@/lib/server/permissions';
import type { WorkspaceRole } from '@/lib/types/workspace';

const AddMemberSchema = z.object({
  email: z.email('有効なメールアドレスを入力してください'),
  role: z.enum(['ADMIN', 'MEMBER'] as const),
});

/**
 * GET /api/workspaces/:id/members
 * メンバー一覧（MEMBER 以上）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { id } = await params;
  const role = await requireRole(user.id, id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data: members, error } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id,
      user_id,
      role,
      joined_at,
      users (
        id,
        email,
        name
      )
    `)
    .eq('workspace_id', id)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Members list error:', error);
    return NextResponse.json(
      { error: 'メンバーの取得に失敗しました' },
      { status: 500 }
    );
  }

  // フラットな構造に変換
  const formattedMembers = (members ?? []).map((m) => {
    const userData = m.users as unknown as {
      id: string;
      email: string;
      name: string;
    };
    return {
      workspace_id: m.workspace_id,
      user_id: m.user_id,
      role: m.role as WorkspaceRole,
      joined_at: m.joined_at,
      user: userData,
    };
  });

  return NextResponse.json({ members: formattedMembers });
}

/**
 * POST /api/workspaces/:id/members
 * メンバー招待（ADMIN 以上）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { id } = await params;
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

  const result = AddMemberSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { email, role: newRole } = result.data;
  const supabase = createServiceClient();

  // 招待対象ユーザーを検索
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('email', email)
    .single();

  if (!targetUser) {
    return NextResponse.json(
      { error: 'ユーザーが見つかりません。先にアカウント登録が必要です。' },
      { status: 404 }
    );
  }

  // 既にメンバーか確認
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', id)
    .eq('user_id', targetUser.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'このユーザーは既にメンバーです' },
      { status: 409 }
    );
  }

  // メンバー追加
  const { error: insertError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: id,
      user_id: targetUser.id,
      role: newRole,
    });

  if (insertError) {
    console.error('Member add error:', insertError);
    return NextResponse.json(
      { error: 'メンバーの追加に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      member: {
        workspace_id: id,
        user_id: targetUser.id,
        role: newRole,
        user: targetUser,
      },
    },
    { status: 201 }
  );
}
