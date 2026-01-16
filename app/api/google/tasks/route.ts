/**
 * app/api/google/tasks/route.ts
 *
 * Phase 14: Google タスク一覧・作成 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { getTasks, createTask, getOrCreateDefaultTaskList } from '@/lib/server/google-tasks';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskListId = searchParams.get('taskListId');
    const showCompleted = searchParams.get('showCompleted') === 'true';

    let listId = taskListId;
    if (!listId) {
      const defaultList = await getOrCreateDefaultTaskList(session.userId);
      if (!defaultList) {
        return NextResponse.json({ error: 'Failed to get task list' }, { status: 500 });
      }
      listId = defaultList.id;
    }

    const tasks = await getTasks(session.userId, listId, { showCompleted });

    return NextResponse.json({
      tasks,
      count: tasks.length,
      taskListId: listId,
    });
  } catch (error) {
    console.error('Error in GET /api/google/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { title, notes, due, taskListId } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let listId = taskListId;
    if (!listId) {
      const defaultList = await getOrCreateDefaultTaskList(session.userId);
      if (!defaultList) {
        return NextResponse.json({ error: 'Failed to get task list' }, { status: 500 });
      }
      listId = defaultList.id;
    }

    const task = await createTask(session.userId, listId, {
      title,
      notes,
      due,
      status: 'needsAction',
    });

    if (!task) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/google/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
