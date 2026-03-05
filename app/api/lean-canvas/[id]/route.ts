/**
 * app/api/lean-canvas/[id]/route.ts
 *
 * 個別 Lean Canvas 操作 API（Phase 16）
 * GET    /api/lean-canvas/:id
 * PUT    /api/lean-canvas/:id
 * DELETE /api/lean-canvas/:id
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toLeanCanvas, type LeanCanvasRow } from '@/lib/types/lean-canvas';

const UpdateCanvasSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
});

type RouteParams = { params: Promise<{ id: string }> };

async function getCanvasWithAuth(request: NextRequest, canvasId: string) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }

  const supabase = createServiceClient();
  const { data: canvas } = await supabase
    .from('lean_canvas')
    .select('*')
    .eq('id', canvasId)
    .single();

  if (!canvas) {
    return { error: NextResponse.json({ error: 'キャンバスが見つかりません' }, { status: 404 }) };
  }

  const role = await requireRole(user.id, canvas.workspace_id, 'MEMBER');
  if (!role) {
    return { error: NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 }) };
  }

  return { user, canvas: canvas as LeanCanvasRow, role, supabase };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await getCanvasWithAuth(request, id);
  if ('error' in result && result.error) return result.error;
  return NextResponse.json({ canvas: toLeanCanvas(result.canvas) });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getCanvasWithAuth(request, id);
  if ('error' in authResult && authResult.error) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が不正です' }, { status: 400 });
  }

  const result = UpdateCanvasSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const updateData: Record<string, string> = {};
  if (result.data.title !== undefined) updateData.title = result.data.title;
  if (result.data.description !== undefined) updateData.description = result.data.description;

  const { data, error } = await authResult.supabase
    .from('lean_canvas')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Lean Canvas update error:', error);
    return NextResponse.json({ error: 'キャンバスの更新に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ canvas: toLeanCanvas(data as LeanCanvasRow) });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getCanvasWithAuth(request, id);
  if ('error' in authResult && authResult.error) return authResult.error;

  const adminRole = await requireRole(authResult.user.id, authResult.canvas.workspace_id, 'ADMIN');
  if (!adminRole) {
    return NextResponse.json({ error: '削除には ADMIN 以上の権限が必要です' }, { status: 403 });
  }

  const { error } = await authResult.supabase.from('lean_canvas').delete().eq('id', id);
  if (error) {
    console.error('Lean Canvas delete error:', error);
    return NextResponse.json({ error: 'キャンバスの削除に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
