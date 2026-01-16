/**
 * app/api/workspaces/[workspaceId]/action-maps/[mapId]/items/route.ts
 *
 * Phase 10: ActionItem API
 * GET  - ActionItem一覧取得
 * POST - ActionItem作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthError } from '@/lib/server/api-auth';
import { CreateActionItemInputSchema } from '@/lib/types/action-map';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; mapId: string }>;
}

// GET: ActionItem一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .eq('action_map_id', mapId)
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching action items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 各Itemの進捗計算
    const items = await Promise.all(
      (data || []).map(async (item) => {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('action_item_id', item.id);

        const taskCount = tasks?.length || 0;
        const completedTaskCount = tasks?.filter((t) => t.status === 'done').length || 0;
        const progressRate = taskCount > 0
          ? Math.round((completedTaskCount / taskCount) * 100)
          : (item.status === 'done' ? 100 : 0);

        return {
          id: item.id,
          actionMapId: item.action_map_id,
          workspaceId: item.workspace_id,
          title: item.title,
          description: item.description,
          dueDate: item.due_date,
          priority: item.priority,
          status: item.status,
          parentItemId: item.parent_item_id,
          sortOrder: item.sort_order,
          version: item.version,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          progressRate,
          taskCount,
          completedTaskCount,
        };
      })
    );

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error in GET /action-maps/[mapId]/items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: ActionItem作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = CreateActionItemInputSchema.safeParse({
      ...body,
      actionMapId: mapId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // sortOrder を自動計算
    const { data: existingItems } = await supabase
      .from('action_items')
      .select('sort_order')
      .eq('action_map_id', mapId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = (existingItems?.[0]?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('action_items')
      .insert({
        action_map_id: mapId,
        workspace_id: workspaceId,
        title: input.title,
        description: input.description ?? null,
        due_date: input.dueDate ?? null,
        priority: input.priority ?? 'medium',
        status: input.status ?? 'not_started',
        parent_item_id: input.parentItemId ?? null,
        sort_order: input.sortOrder ?? nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating action item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const item = {
      id: data.id,
      actionMapId: data.action_map_id,
      workspaceId: data.workspace_id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      priority: data.priority,
      status: data.status,
      parentItemId: data.parent_item_id,
      sortOrder: data.sort_order,
      version: data.version,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progressRate: 0,
      taskCount: 0,
      completedTaskCount: 0,
    };

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error in POST /action-maps/[mapId]/items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
