/**
 * app/api/action-maps/[id]/items/route.ts
 *
 * ActionMap 内の ActionItem 作成 API（Phase 10）
 * POST /api/action-maps/:id/items - ActionItem 作成
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toActionItem, type ActionItemRow } from '@/lib/types/action-map';

const CreateActionItemSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high'] as const).optional(),
  parent_item_id: z.uuid().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/action-maps/:id/items
 * ActionItem 作成
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: actionMapId } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  // ActionMap の存在確認と権限チェック
  const supabase = createServiceClient();
  const { data: map } = await supabase
    .from('action_maps')
    .select('workspace_id')
    .eq('id', actionMapId)
    .single();

  if (!map) {
    return NextResponse.json({ error: 'Action Mapが見つかりません' }, { status: 404 });
  }

  const role = await requireRole(user.id, map.workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
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

  const result = CreateActionItemSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const itemData = result.data;

  // sort_order を取得（現在の最大値 + 1）
  const { data: maxOrderData } = await supabase
    .from('action_items')
    .select('sort_order')
    .eq('action_map_id', actionMapId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrderData?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('action_items')
    .insert({
      action_map_id: actionMapId,
      workspace_id: map.workspace_id,
      title: itemData.title,
      description: itemData.description || '',
      due_date: itemData.due_date || null,
      priority: itemData.priority || 'medium',
      parent_item_id: itemData.parent_item_id || null,
      sort_order: nextOrder,
    })
    .select('*')
    .single();

  if (error) {
    console.error('ActionItem create error:', error);
    return NextResponse.json(
      { error: 'ActionItemの作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { actionItem: toActionItem(data as ActionItemRow) },
    { status: 201 }
  );
}
