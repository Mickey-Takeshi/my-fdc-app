/**
 * app/api/lean-canvas/[id]/blocks/route.ts
 *
 * Lean Canvas ブロック CRUD API（Phase 16）
 * GET  /api/lean-canvas/:id/blocks
 * POST /api/lean-canvas/:id/blocks - upsert
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toLeanCanvasBlock, type LeanCanvasBlockRow } from '@/lib/types/lean-canvas';

const UpsertBlockSchema = z.object({
  block_type: z.enum([
    'problem', 'solution', 'unique_value', 'unfair_advantage',
    'customer_segments', 'key_metrics', 'channels',
    'cost_structure', 'revenue_streams',
  ] as const),
  content: z.string().max(5000).optional().or(z.literal('')),
  items: z.array(z.string()).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: canvasId } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: canvas } = await supabase
    .from('lean_canvas')
    .select('workspace_id')
    .eq('id', canvasId)
    .single();

  if (!canvas) {
    return NextResponse.json({ error: 'キャンバスが見つかりません' }, { status: 404 });
  }

  const role = await requireRole(user.id, canvas.workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('lean_canvas_blocks')
    .select('*')
    .eq('canvas_id', canvasId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Canvas blocks list error:', error);
    return NextResponse.json({ error: 'ブロックの取得に失敗しました' }, { status: 500 });
  }

  const blocks = (data as LeanCanvasBlockRow[]).map(toLeanCanvasBlock);
  return NextResponse.json({ blocks });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: canvasId } = await params;

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

  const result = UpsertBlockSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data: canvas } = await supabase
    .from('lean_canvas')
    .select('workspace_id')
    .eq('id', canvasId)
    .single();

  if (!canvas) {
    return NextResponse.json({ error: 'キャンバスが見つかりません' }, { status: 404 });
  }

  const role = await requireRole(user.id, canvas.workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  // upsert: 既存があれば更新
  const { data: existing } = await supabase
    .from('lean_canvas_blocks')
    .select('id')
    .eq('canvas_id', canvasId)
    .eq('block_type', result.data.block_type)
    .single();

  if (existing) {
    const updateData: Record<string, string | string[]> = {};
    if (result.data.content !== undefined) updateData.content = result.data.content;
    if (result.data.items !== undefined) updateData.items = result.data.items;

    const { data, error } = await supabase
      .from('lean_canvas_blocks')
      .update(updateData)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      console.error('Canvas block update error:', error);
      return NextResponse.json({ error: 'ブロックの更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ block: toLeanCanvasBlock(data as LeanCanvasBlockRow) });
  }

  const { data, error } = await supabase
    .from('lean_canvas_blocks')
    .insert({
      canvas_id: canvasId,
      block_type: result.data.block_type,
      content: result.data.content || '',
      items: result.data.items || [],
    })
    .select('*')
    .single();

  if (error) {
    console.error('Canvas block create error:', error);
    return NextResponse.json({ error: 'ブロックの作成に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ block: toLeanCanvasBlock(data as LeanCanvasBlockRow) }, { status: 201 });
}
