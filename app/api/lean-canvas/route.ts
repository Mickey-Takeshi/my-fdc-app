/**
 * app/api/lean-canvas/route.ts
 *
 * Lean Canvas 一覧取得・作成 API（Phase 16）
 * GET  /api/lean-canvas?workspace_id=xxx
 * POST /api/lean-canvas
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toLeanCanvas, type LeanCanvasRow } from '@/lib/types/lean-canvas';

const CreateCanvasSchema = z.object({
  workspace_id: z.uuid(),
  brand_id: z.uuid(),
  title: z.string().min(1, 'タイトルは必須です').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
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

  const role = await requireRole(user.id, workspaceId, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('lean_canvas')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lean Canvas list error:', error);
    return NextResponse.json({ error: 'キャンバスの取得に失敗しました' }, { status: 500 });
  }

  const canvases = (data as LeanCanvasRow[]).map(toLeanCanvas);
  return NextResponse.json({ canvases });
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

  const result = CreateCanvasSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { workspace_id, ...canvasData } = result.data;

  const role = await requireRole(user.id, workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('lean_canvas')
    .insert({
      workspace_id,
      brand_id: canvasData.brand_id,
      title: canvasData.title,
      description: canvasData.description || '',
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Lean Canvas create error:', error);
    return NextResponse.json({ error: 'キャンバスの作成に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ canvas: toLeanCanvas(data as LeanCanvasRow) }, { status: 201 });
}
