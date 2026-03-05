/**
 * app/api/mvv/[id]/route.ts
 *
 * 個別 MVV 操作 API（Phase 17）
 * PUT    /api/mvv/:id
 * DELETE /api/mvv/:id
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toMVV, type MVVRow } from '@/lib/types/mvv';

const UpdateMVVSchema = z.object({
  mission: z.string().max(2000).optional().or(z.literal('')),
  vision: z.string().max(2000).optional().or(z.literal('')),
  values: z.array(z.string().max(500)).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: mvv } = await supabase
    .from('mvv')
    .select('*, brands!inner(workspace_id)')
    .eq('id', id)
    .single();

  if (!mvv) {
    return NextResponse.json({ error: 'MVVが見つかりません' }, { status: 404 });
  }

  const workspaceId = (mvv as Record<string, unknown> & { brands: { workspace_id: string } }).brands.workspace_id;
  const role = await requireRole(user.id, workspaceId, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が不正です' }, { status: 400 });
  }

  const result = UpdateMVVSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const updateData: Record<string, string | string[]> = {};
  if (result.data.mission !== undefined) updateData.mission = result.data.mission;
  if (result.data.vision !== undefined) updateData.vision = result.data.vision;
  if (result.data.values !== undefined) updateData.values = result.data.values;

  const { data, error } = await supabase
    .from('mvv')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('MVV update error:', error);
    return NextResponse.json({ error: 'MVVの更新に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ mvv: toMVV(data as MVVRow) });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: mvv } = await supabase
    .from('mvv')
    .select('*, brands!inner(workspace_id)')
    .eq('id', id)
    .single();

  if (!mvv) {
    return NextResponse.json({ error: 'MVVが見つかりません' }, { status: 404 });
  }

  const workspaceId = (mvv as Record<string, unknown> & { brands: { workspace_id: string } }).brands.workspace_id;
  const adminRole = await requireRole(user.id, workspaceId, 'ADMIN');
  if (!adminRole) {
    return NextResponse.json({ error: '削除には ADMIN 以上の権限が必要です' }, { status: 403 });
  }

  const { error } = await supabase.from('mvv').delete().eq('id', id);
  if (error) {
    console.error('MVV delete error:', error);
    return NextResponse.json({ error: 'MVVの削除に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
