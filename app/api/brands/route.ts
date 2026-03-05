/**
 * app/api/brands/route.ts
 *
 * ブランド一覧取得・作成 API（Phase 15）
 * GET  /api/brands?workspace_id=xxx
 * POST /api/brands
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toBrand, type BrandRow } from '@/lib/types/brand';

const CreateBrandSchema = z.object({
  workspace_id: z.uuid(),
  name: z.string().min(1, 'ブランド名は必須です').max(200),
  tagline: z.string().max(500).optional().or(z.literal('')),
  story: z.string().max(5000).optional().or(z.literal('')),
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
    .from('brands')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Brands list error:', error);
    return NextResponse.json({ error: 'ブランドの取得に失敗しました' }, { status: 500 });
  }

  const brands = (data as BrandRow[]).map(toBrand);
  return NextResponse.json({ brands });
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

  const result = CreateBrandSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { workspace_id, ...brandData } = result.data;

  const role = await requireRole(user.id, workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('brands')
    .insert({
      workspace_id,
      name: brandData.name,
      tagline: brandData.tagline || '',
      story: brandData.story || '',
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Brand create error:', error);
    return NextResponse.json({ error: 'ブランドの作成に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ brand: toBrand(data as BrandRow) }, { status: 201 });
}
