/**
 * app/api/workspaces/[workspaceId]/action-maps/[mapId]/route.ts
 *
 * Phase 10: 個別ActionMap API
 * GET    - ActionMap取得（ActionItems含む）
 * PATCH  - ActionMap更新
 * DELETE - ActionMap削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthError } from '@/lib/server/api-auth';
import { UpdateActionMapInputSchema } from '@/lib/types/action-map';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; mapId: string }>;
}

// GET: ActionMap取得（ActionItems含む）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    // ActionMap取得
    const { data: mapData, error: mapError } = await supabase
      .from('action_maps')
      .select('*')
      .eq('id', mapId)
      .eq('workspace_id', workspaceId)
      .single();

    if (mapError) {
      if (mapError.code === 'PGRST116') {
        return NextResponse.json({ error: 'ActionMap not found' }, { status: 404 });
      }
      return NextResponse.json({ error: mapError.message }, { status: 500 });
    }

    // ActionItems取得
    const { data: itemsData } = await supabase
      .from('action_items')
      .select('*')
      .eq('action_map_id', mapId)
      .order('sort_order', { ascending: true });

    // 各ActionItemの進捗計算
    const items = await Promise.all(
      (itemsData || []).map(async (item) => {
        // 紐付いたTask取得
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
          linkedTaskIds: tasks?.map((t) => t.id) || [],
        };
      })
    );

    // ActionMap進捗計算
    const itemCount = items.length;
    const completedItemCount = items.filter((i) => i.status === 'done').length;
    const progressRate = itemCount > 0
      ? Math.round(items.reduce((sum, i) => sum + (i.progressRate || 0), 0) / itemCount)
      : 0;

    const actionMap = {
      id: mapData.id,
      workspaceId: mapData.workspace_id,
      title: mapData.title,
      description: mapData.description,
      targetPeriodStart: mapData.target_period_start,
      targetPeriodEnd: mapData.target_period_end,
      isArchived: mapData.is_archived,
      version: mapData.version,
      keyResultId: mapData.key_result_id,  // Phase 11: OKR連携
      createdAt: mapData.created_at,
      updatedAt: mapData.updated_at,
      progressRate,
      itemCount,
      completedItemCount,
      items,
    };

    return NextResponse.json(actionMap);
  } catch (error) {
    console.error('Error in GET /action-maps/[mapId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: ActionMap更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = UpdateActionMapInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.targetPeriodStart !== undefined) updateData.target_period_start = input.targetPeriodStart;
    if (input.targetPeriodEnd !== undefined) updateData.target_period_end = input.targetPeriodEnd;
    if (input.isArchived !== undefined) updateData.is_archived = input.isArchived;
    if (input.keyResultId !== undefined) updateData.key_result_id = input.keyResultId;  // Phase 11: OKR連携

    const { data, error } = await supabase
      .from('action_maps')
      .update(updateData)
      .eq('id', mapId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'ActionMap not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const actionMap = {
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title,
      description: data.description,
      targetPeriodStart: data.target_period_start,
      targetPeriodEnd: data.target_period_end,
      isArchived: data.is_archived,
      version: data.version,
      keyResultId: data.key_result_id,  // Phase 11: OKR連携
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(actionMap);
  } catch (error) {
    console.error('Error in PATCH /action-maps/[mapId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: ActionMap削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { error } = await supabase
      .from('action_maps')
      .delete()
      .eq('id', mapId)
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /action-maps/[mapId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
