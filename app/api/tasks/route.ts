/**
 * app/api/tasks/route.ts
 *
 * タスク一覧取得・作成 API（Phase 9）
 * GET  /api/tasks?workspace_id=xxx - タスク一覧（ワークスペース単位）
 * POST /api/tasks - タスク作成
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/permissions';
import { toTask, type TaskRow } from '@/lib/types/task';

const CreateTaskSchema = z.object({
  workspace_id: z.uuid(),
  title: z.string().min(1, 'タイトルは必須です').max(500),
  description: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(['not_started', 'in_progress', 'done'] as const).optional(),
  suit: z.enum(['spade', 'heart', 'diamond', 'club'] as const).nullable().optional(),
  scheduled_date: z.string().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  priority: z.number().int().min(0).max(10).optional(),
});

/**
 * GET /api/tasks?workspace_id=xxx
 * タスク一覧（MEMBER 以上）
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
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Tasks list error:', error);
    return NextResponse.json(
      { error: 'タスクの取得に失敗しました' },
      { status: 500 }
    );
  }

  const tasks = (data as TaskRow[]).map(toTask);
  return NextResponse.json({ tasks });
}

/**
 * POST /api/tasks
 * タスク作成（MEMBER 以上）
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

  const result = CreateTaskSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'バリデーションエラー' },
      { status: 400 }
    );
  }

  const { workspace_id, ...taskData } = result.data;

  const role = await requireRole(user.id, workspace_id, 'MEMBER');
  if (!role) {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'not_started',
      suit: taskData.suit || null,
      scheduled_date: taskData.scheduled_date || null,
      due_date: taskData.due_date || null,
      priority: taskData.priority ?? 0,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Task create error:', error);
    return NextResponse.json(
      { error: 'タスクの作成に失敗しました' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { task: toTask(data as TaskRow) },
    { status: 201 }
  );
}
