/**
 * app/api/workspaces/[workspaceId]/tasks/route.ts
 *
 * Phase 9: Eisenhower Matrix対応
 * GET  - タスク一覧取得（suit, statusフィルター対応）
 * POST - タスク作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAuthError } from '@/lib/server/api-auth';
import { CreateTaskInputSchema } from '@/lib/types/task';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

// GET: タスク一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    // フィルターパラメータ
    const suit = searchParams.get('suit');
    const status = searchParams.get('status');
    const scheduledDate = searchParams.get('scheduledDate');
    const includeJoker = searchParams.get('includeJoker') === 'true';

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (suit) {
      query = query.eq('suit', suit);
    } else if (includeJoker) {
      query = query.is('suit', null);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (scheduledDate) {
      query = query.eq('scheduled_date', scheduledDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const tasks = (data || []).map((t) => ({
      id: t.id,
      workspaceId: t.workspace_id,
      title: t.title,
      description: t.description,
      status: t.status,
      suit: t.suit,
      scheduledDate: t.scheduled_date,
      dueDate: t.due_date,
      priority: t.priority,
      actionItemId: t.action_item_id,
      linkedActionItemIds: t.linked_action_item_ids,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error in GET /tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: タスク作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = CreateTaskInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        workspace_id: workspaceId,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? 'not_started',
        suit: input.suit ?? null,
        scheduled_date: input.scheduledDate ?? null,
        due_date: input.dueDate ?? null,
        priority: input.priority ?? 0,
        action_item_id: input.actionItemId ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error in POST /tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
