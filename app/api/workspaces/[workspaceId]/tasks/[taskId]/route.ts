/**
 * app/api/workspaces/[workspaceId]/tasks/[taskId]/route.ts
 *
 * Phase 9: 個別タスクAPI
 * GET    - タスク取得
 * PATCH  - タスク更新（suit変更対応）
 * DELETE - タスク削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthError } from '@/lib/server/api-auth';
import { UpdateTaskInputSchema } from '@/lib/types/task';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; taskId: string }>;
}

// GET: タスク取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, taskId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const task = {
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title,
      description: data.description,
      status: data.status,
      suit: data.suit,
      scheduledDate: data.scheduled_date,
      dueDate: data.due_date,
      priority: data.priority,
      actionItemId: data.action_item_id,
      linkedActionItemIds: data.linked_action_item_ids,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error in GET /tasks/[taskId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: タスク更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, taskId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = UpdateTaskInputSchema.safeParse(body);

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
    if (input.status !== undefined) updateData.status = input.status;
    if (input.suit !== undefined) updateData.suit = input.suit;
    if (input.scheduledDate !== undefined) updateData.scheduled_date = input.scheduledDate;
    if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.actionItemId !== undefined) updateData.action_item_id = input.actionItemId;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const task = {
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title,
      description: data.description,
      status: data.status,
      suit: data.suit,
      scheduledDate: data.scheduled_date,
      dueDate: data.due_date,
      priority: data.priority,
      actionItemId: data.action_item_id,
      linkedActionItemIds: data.linked_action_item_ids,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error in PATCH /tasks/[taskId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: タスク削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, taskId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /tasks/[taskId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
