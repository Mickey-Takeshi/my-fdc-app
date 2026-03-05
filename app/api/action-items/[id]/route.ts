/**
 * app/api/action-items/[id]/route.ts
 *
 * 個別 ActionItem 操作 API（Phase 10）
 * PUT    /api/action-items/:id - 更新
 * DELETE /api/action-items/:id - 削除
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toActionItem, type ActionItemRow } from '@/lib/types/action-map';

const UpdateActionItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  due_date: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high'] as const).optional(),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'done'] as const).optional(),
  sort_order: z.number().int().min(0).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

async function getActionItemWithAuth(request: NextRequest, itemId: string) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }

  const supabase = createServiceClient();
  const { data: item } = await supabase
    .from('action_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (!item) {
    return { error: NextResponse.json({ error: 'ActionItemが見つかりません' }, { status: 404 }) };
  }

  const role = await requireRole(user.id, item.workspace_id, 'MEMBER');
  if (!role) {
    return { error: NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 }) };
  }

  return { user, item: item as ActionItemRow, role, supabase };
}

/**
 * PUT /api/action-items/:id
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getActionItemWithAuth(request, id);

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

  const result = UpdateActionItemSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const updateData: Record<string, string | number | null> = {};
  const parsed = result.data;
  if (parsed.title !== undefined) updateData.title = parsed.title;
  if (parsed.description !== undefined) updateData.description = parsed.description;
  if (parsed.due_date !== undefined) updateData.due_date = parsed.due_date;
  if (parsed.priority !== undefined) updateData.priority = parsed.priority;
  if (parsed.status !== undefined) updateData.status = parsed.status;
  if (parsed.sort_order !== undefined) updateData.sort_order = parsed.sort_order;

  const { data, error } = await authResult.supabase
    .from('action_items')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('ActionItem update error:', error);
    return NextResponse.json(
      { error: 'ActionItemの更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ actionItem: toActionItem(data as ActionItemRow) });
}

/**
 * DELETE /api/action-items/:id
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getActionItemWithAuth(request, id);

  if ('error' in authResult && authResult.error) {
    return authResult.error;
  }

  const adminRole = await requireRole(authResult.user.id, authResult.item.workspace_id, 'ADMIN');
  if (!adminRole) {
    return NextResponse.json(
      { error: 'ActionItemの削除にはADMIN以上の権限が必要です' },
      { status: 403 }
    );
  }

  // 紐付きタスクの action_item_id をクリア
  await authResult.supabase
    .from('tasks')
    .update({ action_item_id: null })
    .eq('action_item_id', id);

  const { error } = await authResult.supabase
    .from('action_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('ActionItem delete error:', error);
    return NextResponse.json(
      { error: 'ActionItemの削除に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
