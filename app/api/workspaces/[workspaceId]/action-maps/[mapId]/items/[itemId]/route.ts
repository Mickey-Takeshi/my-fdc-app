/**
 * app/api/workspaces/[workspaceId]/action-maps/[mapId]/items/[itemId]/route.ts
 *
 * Phase 10: 個別ActionItem API
 * GET    - ActionItem取得
 * PATCH  - ActionItem更新
 * DELETE - ActionItem削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateActionItemInputSchema } from '@/lib/types/action-map';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; mapId: string; itemId: string }>;
}

async function checkAuth(request: NextRequest, workspaceId: string) {
  const sessionToken = request.cookies.get('fdc_session')?.value;

  if (!sessionToken) {
    return { error: 'Unauthorized', status: 401 };
  }

  const session = await validateSession(sessionToken);
  if (!session) {
    return { error: 'Invalid session', status: 401 };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return { error: 'Database not configured', status: 500 };
  }

  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', session.userId)
    .single();

  if (error || !membership) {
    return { error: 'Access denied', status: 403 };
  }

  return { session, supabase };
}

// GET: ActionItem取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId, itemId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .eq('id', itemId)
      .eq('action_map_id', mapId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'ActionItem not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 紐付いたTask取得
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status, title')
      .eq('action_item_id', itemId);

    const taskCount = tasks?.length || 0;
    const completedTaskCount = tasks?.filter((t) => t.status === 'done').length || 0;
    const progressRate = taskCount > 0
      ? Math.round((completedTaskCount / taskCount) * 100)
      : (data.status === 'done' ? 100 : 0);

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
      progressRate,
      taskCount,
      completedTaskCount,
      linkedTaskIds: tasks?.map((t) => t.id) || [],
      tasks: tasks || [],
    };

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error in GET /action-items/[itemId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: ActionItem更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId, itemId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = UpdateActionItemInputSchema.safeParse(body);

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
    if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.parentItemId !== undefined) updateData.parent_item_id = input.parentItemId;
    if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

    const { data, error } = await supabase
      .from('action_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('action_map_id', mapId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'ActionItem not found' }, { status: 404 });
      }
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
    };

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error in PATCH /action-items/[itemId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: ActionItem削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId, itemId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    // 紐付いたTaskのaction_item_idをnullに
    await supabase
      .from('tasks')
      .update({ action_item_id: null })
      .eq('action_item_id', itemId);

    const { error } = await supabase
      .from('action_items')
      .delete()
      .eq('id', itemId)
      .eq('action_map_id', mapId)
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /action-items/[itemId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
