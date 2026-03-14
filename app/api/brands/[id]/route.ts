/**
 * app/api/brands/[id]/route.ts
 *
 * 個別ブランド操作 API（Phase 15）
 * GET    /api/brands/:id
 * PUT    /api/brands/:id
 * DELETE /api/brands/:id
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toBrand, type BrandRow } from '@/lib/types/brand';

const UpdateBrandSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tagline: z.string().max(500).optional().or(z.literal('')),
  story: z.string().max(5000).optional().or(z.literal('')),
  logo_url: z.string().max(2000).nullable().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

async function getBrandWithAuth(request: NextRequest, brandId: string) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }

  const supabase = createServiceClient();
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', brandId)
    .single();

  if (!brand) {
    return { error: NextResponse.json({ error: 'ブランドが見つかりません' }, { status: 404 }) };
  }

  const role = await requireRole(user.id, brand.workspace_id, 'MEMBER');
  if (!role) {
    return { error: NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 }) };
  }

  return { user, brand: brand as BrandRow, role, supabase };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await getBrandWithAuth(request, id);

  if ('error' in result && result.error) return result.error;

  return NextResponse.json({ brand: toBrand(result.brand) });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getBrandWithAuth(request, id);

  if ('error' in authResult && authResult.error) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が不正です' }, { status: 400 });
  }

  const result = UpdateBrandSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const updateData: Record<string, string | null> = {};
  const parsed = result.data;
  if (parsed.name !== undefined) updateData.name = parsed.name;
  if (parsed.tagline !== undefined) updateData.tagline = parsed.tagline;
  if (parsed.story !== undefined) updateData.story = parsed.story;
  if (parsed.logo_url !== undefined) updateData.logo_url = parsed.logo_url;

  const { data, error } = await authResult.supabase
    .from('brands')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Brand update error:', error);
    return NextResponse.json({ error: 'ブランドの更新に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ brand: toBrand(data as BrandRow) });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getBrandWithAuth(request, id);

  if ('error' in authResult && authResult.error) return authResult.error;

  const adminRole = await requireRole(authResult.user.id, authResult.brand.workspace_id, 'ADMIN');
  if (!adminRole) {
    return NextResponse.json({ error: '削除には ADMIN 以上の権限が必要です' }, { status: 403 });
  }

  const { error } = await authResult.supabase.from('brands').delete().eq('id', id);
  if (error) {
    console.error('Brand delete error:', error);
    return NextResponse.json({ error: 'ブランドの削除に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
