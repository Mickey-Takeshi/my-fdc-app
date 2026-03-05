/**
 * app/api/objectives/[id]/route.ts
 *
 * 個別 Objective 操作 API（Phase 11）
 * PUT    /api/objectives/:id
 * DELETE /api/objectives/:id
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toObjective, type ObjectiveRow } from '@/lib/types/okr';

const UpdateObjectiveSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  period: z.string().max(50).optional(),
  is_archived: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

async function getObjectiveWithAuth(request: NextRequest, objId: string) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }

  const supabase = createServiceClient();
  const { data: obj } = await supabase
    .from('objectives')
    .select('*')
    .eq('id', objId)
    .single();

  if (!obj) {
    return { error: NextResponse.json({ error: 'Objective が見つかりません' }, { status: 404 }) };
  }

  const role = await requireRole(user.id, obj.workspace_id, 'MEMBER');
  if (!role) {
    return { error: NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 }) };
  }

  return { user, obj: obj as ObjectiveRow, role, supabase };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getObjectiveWithAuth(request, id);

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

  const result = UpdateObjectiveSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const updateData: Record<string, string | boolean> = {};
  const parsed = result.data;
  if (parsed.title !== undefined) updateData.title = parsed.title;
  if (parsed.description !== undefined) updateData.description = parsed.description;
  if (parsed.period !== undefined) updateData.period = parsed.period;
  if (parsed.is_archived !== undefined) updateData.is_archived = parsed.is_archived;

  const { data, error } = await authResult.supabase
    .from('objectives')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Objective update error:', error);
    return NextResponse.json(
      { error: 'Objective の更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ objective: toObjective(data as ObjectiveRow) });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getObjectiveWithAuth(request, id);

  if ('error' in authResult && authResult.error) {
    return authResult.error;
  }

  const adminRole = await requireRole(authResult.user.id, authResult.obj.workspace_id, 'ADMIN');
  if (!adminRole) {
    return NextResponse.json(
      { error: 'Objective の削除には ADMIN 以上の権限が必要です' },
      { status: 403 }
    );
  }

  // 子テーブル key_results を先に削除（カスケード）
  const { error: childError } = await authResult.supabase
    .from('key_results')
    .delete()
    .eq('objective_id', id);

  if (childError) {
    console.error('KeyResults cascade delete error:', childError);
    return NextResponse.json(
      { error: 'Key Results の削除に失敗しました' },
      { status: 500 }
    );
  }

  const { error } = await authResult.supabase
    .from('objectives')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Objective delete error:', error);
    return NextResponse.json(
      { error: 'Objective の削除に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
