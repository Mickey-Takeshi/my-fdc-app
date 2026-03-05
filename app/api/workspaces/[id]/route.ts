/**
 * app/api/workspaces/[id]/route.ts
 *
 * 個別ワークスペース操作 API（Phase 5）
 * GET    /api/workspaces/:id - ワークスペース詳細取得
 * PUT    /api/workspaces/:id - ワークスペース名更新（ADMIN 以上）
 * DELETE /api/workspaces/:id - ワークスペース削除（OWNER のみ）
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole, PERMISSIONS } from '@/lib/server/permissions';

const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1, 'ワークスペース名は必須です').max(100),
});

/**
 * GET /api/workspaces/:id
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
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !workspace) {
    return NextResponse.json(
      { error: 'ワークスペースが見つかりません' },
      { status: 404 }
    );
  }

  return NextResponse.json({ workspace: { ...workspace, role } });
}

/**
 * PUT /api/workspaces/:id
 * ADMIN 以上が必要
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { id } = await params;
  const role = await requireRole(user.id, id, 'ADMIN');
  if (!role || !PERMISSIONS.canUpdateWorkspace(role)) {
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

  const result = UpdateWorkspaceSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .update({ name: result.data.name, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !workspace) {
    return NextResponse.json(
      { error: 'ワークスペースの更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ workspace });
}

/**
 * DELETE /api/workspaces/:id
 * OWNER のみ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { id } = await params;
  const role = await requireRole(user.id, id, 'OWNER');
  if (!role || !PERMISSIONS.canDeleteWorkspace(role)) {
    return NextResponse.json({ error: 'OWNER 権限が必要です' }, { status: 403 });
  }

  const supabase = createServiceClient();

  // メンバーを先に削除（外部キー制約のため）
  await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', id);

  // ワークスペースを削除
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Workspace deletion error:', error);
    return NextResponse.json(
      { error: 'ワークスペースの削除に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
