/**
 * app/api/google/tasks/[id]/route.ts
 *
 * 個別 Google Task 更新・削除 API（Phase 14）
 * PUT    /api/google/tasks/:id - タスク更新
 * DELETE /api/google/tasks/:id - タスク削除
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getGoogleAccessToken } from '@/lib/server/google-auth';
import type { GoogleTask } from '@/lib/types/google-tasks';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/google/tasks/:id
 * Google Task を更新
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const accessToken = await getGoogleAccessToken(user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Google API 連携が無効です。再ログインしてください。' },
      { status: 403 }
    );
  }

  let body: {
    title?: string;
    notes?: string;
    due?: string | null;
    status?: string;
    task_list_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'リクエストの形式が不正です' },
      { status: 400 }
    );
  }

  const listId = body.task_list_id || '@default';

  try {
    const updateBody: Record<string, string | null> = {};
    if (body.title !== undefined) updateBody.title = body.title;
    if (body.notes !== undefined) updateBody.notes = body.notes;
    if (body.due !== undefined) updateBody.due = body.due;
    if (body.status !== undefined) updateBody.status = body.status;

    const res = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateBody),
      }
    );

    if (!res.ok) {
      console.error('Google Task update error:', res.status, await res.text());
      return NextResponse.json(
        { error: 'タスクの更新に失敗しました' },
        { status: res.status }
      );
    }

    const updated: GoogleTask = await res.json();
    return NextResponse.json({ task: updated });
  } catch {
    return NextResponse.json(
      { error: 'Google Tasks API 呼び出しに失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/google/tasks/:id
 * Google Task を削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const accessToken = await getGoogleAccessToken(user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Google API 連携が無効です。再ログインしてください。' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const listId = searchParams.get('task_list_id') || '@default';

  try {
    const res = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      console.error('Google Task delete error:', res.status, await res.text());
      return NextResponse.json(
        { error: 'タスクの削除に失敗しました' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Google Tasks API 呼び出しに失敗しました' },
      { status: 500 }
    );
  }
}
