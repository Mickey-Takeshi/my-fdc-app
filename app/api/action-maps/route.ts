/**
 * app/api/action-maps/route.ts
 *
 * ActionMap 一覧取得・作成 API（Phase 10）
 * GET  /api/action-maps?workspace_id=xxx - ActionMap 一覧
 * POST /api/action-maps - ActionMap 作成
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import {
  toActionMap,
  toActionItem,
  type ActionMapRow,
  type ActionItemRow,
  type ActionMap,
} from '@/lib/types/action-map';
import type { TaskRow } from '@/lib/types/task';

const CreateActionMapSchema = z.object({
  workspace_id: z.uuid(),
  title: z.string().min(1, 'タイトルは必須です').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  target_period_start: z.string().optional().or(z.literal('')),
  target_period_end: z.string().optional().or(z.literal('')),
});

/**
 * ActionMap に ActionItems と Task 進捗を結合
 */
async function enrichActionMaps(
  maps: ActionMap[],
  workspaceId: string
): Promise<ActionMap[]> {
  if (maps.length === 0) return maps;

  const supabase = createServiceClient();

  // ActionItems を取得
  const { data: itemRows } = await supabase
    .from('action_items')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('sort_order', { ascending: true });

  const items = (itemRows as ActionItemRow[] | null)?.map(toActionItem) ?? [];

  // Tasks を取得（action_item_id が設定されているもの）
  const { data: taskRows } = await supabase
    .from('tasks')
    .select('id, action_item_id, status')
    .eq('workspace_id', workspaceId)
    .not('action_item_id', 'is', null);

  const tasks = (taskRows as Pick<TaskRow, 'id' | 'action_item_id' | 'status'>[] | null) ?? [];

  // ActionItem ごとの Task 進捗を計算
  const itemsWithProgress = items.map((item) => {
    const linkedTasks = tasks.filter((t) => t.action_item_id === item.id);
    const linkedTaskCount = linkedTasks.length;
    const doneTaskCount = linkedTasks.filter((t) => t.status === 'done').length;
    const progressRate = linkedTaskCount > 0
      ? Math.round((doneTaskCount / linkedTaskCount) * 100)
      : (item.status === 'done' ? 100 : 0);

    return { ...item, linkedTaskCount, doneTaskCount, progressRate };
  });

  // ActionMap に items と progress を結合
  return maps.map((map) => {
    const mapItems = itemsWithProgress.filter((i) => i.actionMapId === map.id);
    const progressRate = mapItems.length > 0
      ? Math.round(mapItems.reduce((sum, i) => sum + (i.progressRate ?? 0), 0) / mapItems.length)
      : 0;

    return { ...map, items: mapItems, progressRate };
  });
}

/**
 * GET /api/action-maps?workspace_id=xxx
 * ActionMap 一覧（MEMBER 以上）
 */
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
    .from('action_maps')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('ActionMaps list error:', error);
    return NextResponse.json(
      { error: 'Action Mapの取得に失敗しました' },
      { status: 500 }
    );
  }

  const maps = (data as ActionMapRow[]).map(toActionMap);
  const enrichedMaps = await enrichActionMaps(maps, workspaceId);

  return NextResponse.json({ actionMaps: enrichedMaps });
}

/**
 * POST /api/action-maps
 * ActionMap 作成（MEMBER 以上）
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
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

  const result = CreateActionMapSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { workspace_id, ...mapData } = result.data;

  const role = await requireRole(user.id, workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('action_maps')
    .insert({
      workspace_id,
      title: mapData.title,
      description: mapData.description || '',
      target_period_start: mapData.target_period_start || null,
      target_period_end: mapData.target_period_end || null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('ActionMap create error:', error);
    return NextResponse.json(
      { error: 'Action Mapの作成に失敗しました' },
      { status: 500 }
    );
  }

  const actionMap = toActionMap(data as ActionMapRow);
  return NextResponse.json(
    { actionMap: { ...actionMap, items: [], progressRate: 0 } },
    { status: 201 }
  );
}
