/**
 * app/api/action-maps/[id]/route.ts
 *
 * 個別 ActionMap 操作 API（Phase 10）
 * PUT    /api/action-maps/:id - 更新
 * DELETE /api/action-maps/:id - 削除
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toActionMap, type ActionMapRow } from '@/lib/types/action-map';

const UpdateActionMapSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  target_period_start: z.string().nullable().optional(),
  target_period_end: z.string().nullable().optional(),
  is_archived: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

async function getActionMapWithAuth(request: NextRequest, mapId: string) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }

  const supabase = createServiceClient();
  const { data: map } = await supabase
    .from('action_maps')
    .select('*')
    .eq('id', mapId)
    .single();

  if (!map) {
    return { error: NextResponse.json({ error: 'Action Mapが見つかりません' }, { status: 404 }) };
  }

  const role = await requireRole(user.id, map.workspace_id, 'MEMBER');
  if (!role) {
    return { error: NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 }) };
  }

  return { user, map: map as ActionMapRow, role, supabase };
}

/**
 * PUT /api/action-maps/:id
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getActionMapWithAuth(request, id);

  if ('error' in authResult && authResult.error) {
    return authResult.error;
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

  const result = UpdateActionMapSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const updateData: Record<string, string | boolean | null> = {};
  const parsed = result.data;
  if (parsed.title !== undefined) updateData.title = parsed.title;
  if (parsed.description !== undefined) updateData.description = parsed.description;
  if (parsed.target_period_start !== undefined) updateData.target_period_start = parsed.target_period_start;
  if (parsed.target_period_end !== undefined) updateData.target_period_end = parsed.target_period_end;
  if (parsed.is_archived !== undefined) updateData.is_archived = parsed.is_archived;

  const { data, error } = await authResult.supabase
    .from('action_maps')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('ActionMap update error:', error);
    return NextResponse.json(
      { error: 'Action Mapの更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ actionMap: toActionMap(data as ActionMapRow) });
}

/**
 * DELETE /api/action-maps/:id
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getActionMapWithAuth(request, id);

  if ('error' in authResult && authResult.error) {
    return authResult.error;
  }

  const adminRole = await requireRole(authResult.user.id, authResult.map.workspace_id, 'ADMIN');
  if (!adminRole) {
    return NextResponse.json(
      { error: 'Action Mapの削除にはADMIN以上の権限が必要です' },
      { status: 403 }
    );
  }

  const { error } = await authResult.supabase
    .from('action_maps')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('ActionMap delete error:', error);
    return NextResponse.json(
      { error: 'Action Mapの削除に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
