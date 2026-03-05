/**
 * app/api/mvv/route.ts
 *
 * MVV 一覧取得・作成 API（Phase 17）
 * GET  /api/mvv?brand_id=xxx
 * POST /api/mvv
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toMVV, type MVVRow } from '@/lib/types/mvv';

const CreateMVVSchema = z.object({
  brand_id: z.uuid(),
  mission: z.string().max(2000).optional().or(z.literal('')),
  vision: z.string().max(2000).optional().or(z.literal('')),
  values: z.array(z.string().max(500)).optional(),
});

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const brandId = request.nextUrl.searchParams.get('brand_id');
  if (!brandId) {
    return NextResponse.json({ error: 'brand_id は必須です' }, { status: 400 });
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
    .from('mvv')
    .select('*')
    .eq('brand_id', brandId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('MVV fetch error:', error);
    return NextResponse.json({ error: 'MVVの取得に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ mvv: data ? toMVV(data as MVVRow) : null });
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

  const result = CreateMVVSchema.safeParse(body);
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
    .eq('id', result.data.brand_id)
    .single();

  if (!brand) {
    return NextResponse.json({ error: 'ブランドが見つかりません' }, { status: 404 });
  }

  const role = await requireRole(user.id, brand.workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('mvv')
    .insert({
      brand_id: result.data.brand_id,
      mission: result.data.mission || '',
      vision: result.data.vision || '',
      values: result.data.values || [],
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error) {
    console.error('MVV create error:', error);
    return NextResponse.json({ error: 'MVVの作成に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ mvv: toMVV(data as MVVRow) }, { status: 201 });
}
