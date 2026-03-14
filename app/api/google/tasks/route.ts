/**
 * app/api/google/tasks/route.ts
 *
 * Google Tasks 一覧取得・作成 API（Phase 14）
 * GET  /api/google/tasks?task_list_id=xxx - タスク一覧
 * POST /api/google/tasks - Google にタスク作成
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { getGoogleAccessToken } from '@/lib/server/google-auth';
import type { GoogleTask, GoogleTaskList } from '@/lib/types/google-tasks';

/**
 * GET /api/google/tasks?task_list_id=xxx
 * task_list_id がない場合はデフォルトリストを使用
 * task_list_id=_lists の場合はタスクリスト一覧を返す
 */
export async function GET(request: NextRequest) {
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
  const taskListId = searchParams.get('task_list_id');

  try {
    // タスクリスト一覧を返す
    if (taskListId === '_lists') {
      const res = await fetch(
        'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!res.ok) {
        console.error('Google TaskLists API error:', res.status, await res.text());
        return NextResponse.json(
          { error: 'タスクリストの取得に失敗しました' },
          { status: res.status }
        );
      }

      const data = await res.json();
      const taskLists: GoogleTaskList[] = (data.items ?? []).map(
        (item: GoogleTaskList) => ({
          id: item.id,
          title: item.title,
          updated: item.updated,
        })
      );

      return NextResponse.json({ taskLists });
    }

    // タスク一覧を返す
    const listId = taskListId || '@default';
    const params = new URLSearchParams({
      showCompleted: 'true',
      showHidden: 'false',
      maxResults: '100',
    });

    const res = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      console.error('Google Tasks API error:', res.status, await res.text());
      return NextResponse.json(
        { error: 'タスクの取得に失敗しました' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const tasks: GoogleTask[] = (data.items ?? [])
      .filter((item: GoogleTask) => !item.deleted && !item.hidden)
      .map((item: GoogleTask) => ({
        id: item.id,
        title: item.title || '',
        notes: item.notes || '',
        status: item.status,
        due: item.due || null,
        updated: item.updated,
      }));

    return NextResponse.json({ tasks, taskListId: listId });
  } catch {
    return NextResponse.json(
      { error: 'Google Tasks API 呼び出しに失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/google/tasks
 * Google Tasks にタスクを作成
 */
export async function POST(request: NextRequest) {
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

  let body: { title: string; notes?: string; due?: string; status?: string; task_list_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'リクエストの形式が不正です' },
      { status: 400 }
    );
  }

  if (!body.title) {
    return NextResponse.json(
      { error: 'タイトルは必須です' },
      { status: 400 }
    );
  }

  const listId = body.task_list_id || '@default';

  try {
    const taskBody: Record<string, string> = {
      title: body.title,
    };
    if (body.notes) taskBody.notes = body.notes;
    if (body.due) taskBody.due = body.due;
    if (body.status) taskBody.status = body.status;

    const res = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskBody),
      }
    );

    if (!res.ok) {
      console.error('Google Task create error:', res.status, await res.text());
      return NextResponse.json(
        { error: 'タスクの作成に失敗しました' },
        { status: res.status }
      );
    }

    const created: GoogleTask = await res.json();
    return NextResponse.json({ task: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Google Tasks API 呼び出しに失敗しました' },
      { status: 500 }
    );
  }
}
