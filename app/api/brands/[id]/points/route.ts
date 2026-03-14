/**
 * app/api/brands/[id]/points/route.ts
 *
 * ブランドポイント CRUD API（Phase 15）
 * GET  /api/brands/:id/points - ポイント一覧
 * POST /api/brands/:id/points - ポイント作成/更新（upsert）
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toBrandPoint, type BrandPointRow } from '@/lib/types/brand';

const UpsertPointSchema = z.object({
  point_type: z.enum([
    'mission', 'vision', 'target_audience', 'unique_value',
    'brand_personality', 'tone_voice', 'visual_identity',
    'key_messages', 'competitors', 'differentiators',
  ] as const),
  content: z.string().max(5000),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: brandId } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // ブランドの workspace_id を取得して権限チェック
  const { data: brand } = await supabase
    .from('brands')
    .select('workspace_id')
    .eq('id', brandId)
    .single();

  if (!brand) {
    return NextResponse.json({ error: 'ブランドが見つかりません' }, { status: 404 });
  }

  const role = await requireRole(user.id, brand.workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('brand_points')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Brand points list error:', error);
    return NextResponse.json({ error: 'ポイントの取得に失敗しました' }, { status: 500 });
  }

  const points = (data as BrandPointRow[]).map(toBrandPoint);
  return NextResponse.json({ points });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: brandId } = await params;

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

  const result = UpsertPointSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: brand } = await supabase
    .from('brands')
    .select('workspace_id')
    .eq('id', brandId)
    .single();

  if (!brand) {
    return NextResponse.json({ error: 'ブランドが見つかりません' }, { status: 404 });
  }

  const role = await requireRole(user.id, brand.workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  // 既存のポイントがあれば更新、なければ作成
  const { data: existing } = await supabase
    .from('brand_points')
    .select('id')
    .eq('brand_id', brandId)
    .eq('point_type', result.data.point_type)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('brand_points')
      .update({ content: result.data.content })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      console.error('Brand point update error:', error);
      return NextResponse.json({ error: 'ポイントの更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ point: toBrandPoint(data as BrandPointRow) });
  }

  const { data, error } = await supabase
    .from('brand_points')
    .insert({
      brand_id: brandId,
      point_type: result.data.point_type,
      content: result.data.content,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Brand point create error:', error);
    return NextResponse.json({ error: 'ポイントの作成に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ point: toBrandPoint(data as BrandPointRow) }, { status: 201 });
}
