/**
 * app/api/tasks/[id]/route.ts
 *
 * 個別タスク操作 API（Phase 9）
 * GET    /api/tasks/:id - タスク詳細
 * PUT    /api/tasks/:id - タスク更新
 * DELETE /api/tasks/:id - タスク削除
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toTask, type TaskRow } from '@/lib/types/task';

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(['not_started', 'in_progress', 'done'] as const).optional(),
  suit: z.enum(['spade', 'heart', 'diamond', 'club'] as const).nullable().optional(),
  scheduled_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  priority: z.number().int().min(0).max(10).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * タスクの workspace_id を取得して権限チェック
 */
async function getTaskWithAuth(
  request: NextRequest,
  taskId: string
) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }

  const supabase = createServiceClient();
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!task) {
    return { error: NextResponse.json({ error: 'タスクが見つかりません' }, { status: 404 }) };
  }

  const role = await requireRole(user.id, task.workspace_id, 'MEMBER');
  if (!role) {
    return { error: NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 }) };
  }

  return { user, task: task as TaskRow, role, supabase };
}

/**
 * GET /api/tasks/:id
 * タスク詳細
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await getTaskWithAuth(request, id);

  if ('error' in result && result.error) {
    return result.error;
  }

  return NextResponse.json({ task: toTask(result.task) });
}

/**
 * PUT /api/tasks/:id
 * タスク更新（MEMBER 以上）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getTaskWithAuth(request, id);

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

  const result = UpdateTaskSchema.safeParse(body);
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
  if (parsed.status !== undefined) updateData.status = parsed.status;
  if (parsed.suit !== undefined) updateData.suit = parsed.suit;
  if (parsed.scheduled_date !== undefined) updateData.scheduled_date = parsed.scheduled_date;
  if (parsed.due_date !== undefined) updateData.due_date = parsed.due_date;
  if (parsed.priority !== undefined) updateData.priority = parsed.priority;

  const { data, error } = await authResult.supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Task update error:', error);
    return NextResponse.json(
      { error: 'タスクの更新に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ task: toTask(data as TaskRow) });
}

/**
 * DELETE /api/tasks/:id
 * タスク削除（ADMIN 以上）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const authResult = await getTaskWithAuth(request, id);

  if ('error' in authResult && authResult.error) {
    return authResult.error;
  }

  // 削除は ADMIN 以上
  const adminRole = await requireRole(authResult.user.id, authResult.task.workspace_id, 'ADMIN');
  if (!adminRole) {
    return NextResponse.json(
      { error: 'タスクの削除には ADMIN 以上の権限が必要です' },
      { status: 403 }
    );
  }

  const { error } = await authResult.supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Task delete error:', error);
    return NextResponse.json(
      { error: 'タスクの削除に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
