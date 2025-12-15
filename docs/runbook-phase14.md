# Phase 14: Google Tasks 双方向同期

## このPhaseの目標

Google Tasks API を使って、FDCのタスクと双方向同期を実装：
- Google Tasks の取得・作成・更新
- FDC Task ↔ Google Task の双方向同期
- 競合解決（Last Write Wins）

---

## 習得する新しい概念

- **Google Tasks API**: Googleタスクを操作するAPI
- **双方向同期**: ローカル→リモート、リモート→ローカルの両方向でデータ反映
- **競合解決**: 同じデータを両方で編集した時の衝突を解決
- **Last Write Wins**: 最新の更新を正とする競合解決戦略
- **Sync Token**: 差分同期のためのトークン

---

## 前提条件

- Phase 12-13 完了（Google OAuth + Calendar 動作）
- Tasks スコープが有効（`https://www.googleapis.com/auth/tasks`）
- users テーブルに google_access_token が保存されている

---

## Step 1: 型定義

### 1.1 Google Tasks 型定義

**ファイル**: `lib/types/google-tasks.ts`

```typescript
/**
 * lib/types/google-tasks.ts
 *
 * Phase 14: Google Tasks API の型定義
 */

/**
 * Google タスクリスト
 */
export interface GoogleTaskList {
  kind: string;
  id: string;
  etag: string;
  title: string;
  updated: string;
  selfLink: string;
}

/**
 * タスクリスト一覧レスポンス
 */
export interface GoogleTaskListsResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  items: GoogleTaskList[];
}

/**
 * Google タスク
 */
export interface GoogleTask {
  kind: string;
  id: string;
  etag: string;
  title: string;
  updated: string;  // RFC3339 - 競合解決に使用
  selfLink: string;
  parent?: string;
  position: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;     // RFC3339 - 期限
  completed?: string; // RFC3339 - 完了日時
  deleted?: boolean;
  hidden?: boolean;
  links?: Array<{
    type: string;
    description?: string;
    link: string;
  }>;
}

/**
 * タスク一覧レスポンス
 */
export interface GoogleTasksResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  items?: GoogleTask[];
}

/**
 * タスク作成/更新リクエスト
 */
export interface GoogleTaskRequest {
  title: string;
  notes?: string;
  status?: 'needsAction' | 'completed';
  due?: string;
}

/**
 * 同期状態
 */
export interface SyncStatus {
  lastSyncAt: string | null;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  error?: string;
  syncedCount?: number;
}

/**
 * 同期結果
 */
export interface SyncResult {
  success: boolean;
  createdInFDC: number;
  updatedInFDC: number;
  createdInGoogle: number;
  updatedInGoogle: number;
  errors: string[];
  lastSyncAt: string;
}

/**
 * FDC タスクと Google Task のマッピング
 */
export interface TaskSyncMapping {
  fdcTaskId: string;
  googleTaskId: string;
  googleTaskListId: string;
  lastSyncedAt: string;
  syncDirection: 'fdc_to_google' | 'google_to_fdc' | 'bidirectional';
}
```

### 確認ポイント

- [ ] `lib/types/google-tasks.ts` が作成された
- [ ] GoogleTaskList, GoogleTask 型が定義されている
- [ ] SyncStatus, SyncResult 型が定義されている

---

## Step 2: データベーススキーマ更新

### 2.1 tasks テーブルに同期カラム追加

**SQL実行**: Supabase Dashboard → SQL Editor

```sql
-- Phase 14: tasks テーブルに Google Tasks 同期用カラムを追加

-- Google Task ID（同期用）
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS google_task_id TEXT;

-- Google Task List ID
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS google_task_list_id TEXT;

-- 最終同期日時
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- suit カラム（Phase 13 のアイゼンハワーマトリクス用）
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS suit TEXT CHECK (suit IN ('spade', 'heart', 'diamond', 'club', 'joker', 'unclassified'));

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_tasks_google_task_id ON tasks(google_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_suit ON tasks(suit);

-- コメント追加
COMMENT ON COLUMN tasks.google_task_id IS 'Google Tasks APIのタスクID';
COMMENT ON COLUMN tasks.google_task_list_id IS 'Google Tasksのタスクリスト ID';
COMMENT ON COLUMN tasks.last_synced_at IS '最終同期日時（競合解決に使用）';
COMMENT ON COLUMN tasks.suit IS 'アイゼンハワーマトリクス分類（spade/heart/diamond/club/joker/unclassified）';
```

### 2.2 同期設定テーブル作成

```sql
-- Phase 14: 同期設定テーブル

CREATE TABLE IF NOT EXISTS sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Google Tasks 設定
  google_task_list_id TEXT,
  google_task_list_name TEXT,

  -- 同期状態
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'synced', 'error')),
  sync_error TEXT,

  -- 設定
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_minutes INTEGER DEFAULT 15,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, workspace_id)
);

-- RLS 有効化
ALTER TABLE sync_settings ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー
CREATE POLICY "Users can manage own sync settings" ON sync_settings
  FOR ALL USING (user_id = auth.uid());
```

### 確認ポイント

- [ ] tasks テーブルに google_task_id カラムが追加された
- [ ] tasks テーブルに google_task_list_id カラムが追加された
- [ ] tasks テーブルに last_synced_at カラムが追加された
- [ ] tasks テーブルに suit カラムが追加された
- [ ] sync_settings テーブルが作成された

---

## Step 3: Google Tasks API ユーティリティ

### 3.1 Tasks API クライアント

**ファイル**: `lib/server/google-tasks.ts`

```typescript
/**
 * lib/server/google-tasks.ts
 *
 * Phase 14: Google Tasks API クライアント
 */

import { getValidAccessToken } from './google-tokens';
import type {
  GoogleTaskList,
  GoogleTaskListsResponse,
  GoogleTask,
  GoogleTasksResponse,
  GoogleTaskRequest,
} from '@/lib/types/google-tasks';

const TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';

/**
 * Google Tasks API を呼び出す
 */
async function callTasksApi<T>(
  userId: string,
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
  } = {}
): Promise<T | null> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    console.error('[Tasks API] No valid access token');
    return null;
  }

  const url = new URL(`${TASKS_API_BASE}${endpoint}`);
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Tasks API] Error:', response.status, errorText);
    return null;
  }

  // DELETE は 204 No Content を返す
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * タスクリスト一覧を取得
 */
export async function getTaskLists(userId: string): Promise<GoogleTaskList[]> {
  const response = await callTasksApi<GoogleTaskListsResponse>(
    userId,
    '/users/@me/lists'
  );

  return response?.items || [];
}

/**
 * デフォルトのタスクリストを取得（または作成）
 */
export async function getOrCreateDefaultTaskList(
  userId: string,
  listName: string = 'FDC Tasks'
): Promise<GoogleTaskList | null> {
  const lists = await getTaskLists(userId);

  // 既存のリストを探す
  const existing = lists.find((l) => l.title === listName);
  if (existing) {
    return existing;
  }

  // なければ作成
  const created = await callTasksApi<GoogleTaskList>(
    userId,
    '/users/@me/lists',
    {
      method: 'POST',
      body: { title: listName },
    }
  );

  return created;
}

/**
 * タスク一覧を取得
 */
export async function getTasks(
  userId: string,
  taskListId: string,
  options: {
    showCompleted?: boolean;
    showHidden?: boolean;
    maxResults?: number;
    updatedMin?: string;
  } = {}
): Promise<GoogleTask[]> {
  const params: Record<string, string> = {
    maxResults: String(options.maxResults || 100),
  };

  if (options.showCompleted !== undefined) {
    params.showCompleted = String(options.showCompleted);
  }
  if (options.showHidden !== undefined) {
    params.showHidden = String(options.showHidden);
  }
  if (options.updatedMin) {
    params.updatedMin = options.updatedMin;
  }

  const response = await callTasksApi<GoogleTasksResponse>(
    userId,
    `/lists/${taskListId}/tasks`,
    { params }
  );

  return response?.items || [];
}

/**
 * タスクを取得
 */
export async function getTask(
  userId: string,
  taskListId: string,
  taskId: string
): Promise<GoogleTask | null> {
  return callTasksApi<GoogleTask>(
    userId,
    `/lists/${taskListId}/tasks/${taskId}`
  );
}

/**
 * タスクを作成
 */
export async function createTask(
  userId: string,
  taskListId: string,
  task: GoogleTaskRequest
): Promise<GoogleTask | null> {
  return callTasksApi<GoogleTask>(
    userId,
    `/lists/${taskListId}/tasks`,
    {
      method: 'POST',
      body: task,
    }
  );
}

/**
 * タスクを更新
 */
export async function updateTask(
  userId: string,
  taskListId: string,
  taskId: string,
  task: Partial<GoogleTaskRequest>
): Promise<GoogleTask | null> {
  return callTasksApi<GoogleTask>(
    userId,
    `/lists/${taskListId}/tasks/${taskId}`,
    {
      method: 'PATCH',
      body: task,
    }
  );
}

/**
 * タスクを削除
 */
export async function deleteTask(
  userId: string,
  taskListId: string,
  taskId: string
): Promise<boolean> {
  await callTasksApi(
    userId,
    `/lists/${taskListId}/tasks/${taskId}`,
    { method: 'DELETE' }
  );
  return true;
}

/**
 * タスクを完了にする
 */
export async function completeTask(
  userId: string,
  taskListId: string,
  taskId: string
): Promise<GoogleTask | null> {
  return updateTask(userId, taskListId, taskId, {
    status: 'completed',
  });
}

/**
 * タスクを未完了に戻す
 */
export async function uncompleteTask(
  userId: string,
  taskListId: string,
  taskId: string
): Promise<GoogleTask | null> {
  return updateTask(userId, taskListId, taskId, {
    status: 'needsAction',
  });
}
```

### 確認ポイント

- [ ] `lib/server/google-tasks.ts` が作成された
- [ ] getTaskLists 関数が実装されている
- [ ] getTasks, createTask, updateTask, deleteTask が実装されている

---

## Step 4: 同期ロジック実装

### 4.1 同期サービス

**ファイル**: `lib/server/task-sync.ts`

```typescript
/**
 * lib/server/task-sync.ts
 *
 * Phase 14: タスク同期サービス
 */

import { createAdminClient } from '@/lib/supabase/client';
import {
  getOrCreateDefaultTaskList,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from './google-tasks';
import type { GoogleTask, SyncResult } from '@/lib/types/google-tasks';

interface FDCTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  google_task_id?: string;
  google_task_list_id?: string;
  last_synced_at?: string;
  updated_at: string;
  workspace_id: string;
}

/**
 * タスクを同期
 */
export async function syncTasks(
  userId: string,
  workspaceId: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    createdInFDC: 0,
    updatedInFDC: 0,
    createdInGoogle: 0,
    updatedInGoogle: 0,
    errors: [],
    lastSyncAt: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (!supabase) {
    result.errors.push('Database not configured');
    return result;
  }

  try {
    // 1. Google タスクリストを取得/作成
    const taskList = await getOrCreateDefaultTaskList(userId);
    if (!taskList) {
      result.errors.push('Failed to get/create task list');
      return result;
    }

    // 2. 同期設定を更新
    await supabase.from('sync_settings').upsert({
      user_id: userId,
      workspace_id: workspaceId,
      google_task_list_id: taskList.id,
      google_task_list_name: taskList.title,
      sync_status: 'syncing',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,workspace_id',
    });

    // 3. Google Tasks を取得
    const googleTasks = await getTasks(userId, taskList.id, {
      showCompleted: true,
    });

    // 4. FDC Tasks を取得
    const { data: fdcTasks, error: fdcError } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (fdcError) {
      result.errors.push(`Failed to get FDC tasks: ${fdcError.message}`);
      return result;
    }

    // 5. Google → FDC 同期
    for (const gt of googleTasks) {
      try {
        const syncResult = await syncGoogleToFDC(
          supabase,
          gt,
          taskList.id,
          workspaceId,
          fdcTasks || []
        );
        if (syncResult === 'created') result.createdInFDC++;
        if (syncResult === 'updated') result.updatedInFDC++;
      } catch (err) {
        result.errors.push(`Google→FDC sync error: ${(err as Error).message}`);
      }
    }

    // 6. FDC → Google 同期
    for (const ft of fdcTasks || []) {
      try {
        const syncResult = await syncFDCToGoogle(
          supabase,
          userId,
          taskList.id,
          ft,
          googleTasks
        );
        if (syncResult === 'created') result.createdInGoogle++;
        if (syncResult === 'updated') result.updatedInGoogle++;
      } catch (err) {
        result.errors.push(`FDC→Google sync error: ${(err as Error).message}`);
      }
    }

    // 7. 同期完了
    await supabase.from('sync_settings').update({
      last_sync_at: result.lastSyncAt,
      sync_status: 'synced',
      sync_error: null,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('workspace_id', workspaceId);

    result.success = true;
  } catch (err) {
    result.errors.push(`Sync error: ${(err as Error).message}`);

    // エラー状態を保存
    await supabase?.from('sync_settings').update({
      sync_status: 'error',
      sync_error: (err as Error).message,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('workspace_id', workspaceId);
  }

  return result;
}

/**
 * Google → FDC 同期
 */
async function syncGoogleToFDC(
  supabase: ReturnType<typeof createAdminClient>,
  googleTask: GoogleTask,
  taskListId: string,
  workspaceId: string,
  fdcTasks: FDCTask[]
): Promise<'created' | 'updated' | 'skipped'> {
  if (!supabase) return 'skipped';

  // 削除済みはスキップ
  if (googleTask.deleted) return 'skipped';

  // FDC で対応するタスクを探す
  const fdcTask = fdcTasks.find((t) => t.google_task_id === googleTask.id);

  if (!fdcTask) {
    // FDC にない → 新規作成
    await supabase.from('tasks').insert({
      workspace_id: workspaceId,
      title: googleTask.title,
      description: googleTask.notes,
      status: googleTask.status === 'completed' ? 'done' : 'todo',
      due_date: googleTask.due ? googleTask.due.split('T')[0] : null,
      google_task_id: googleTask.id,
      google_task_list_id: taskListId,
      last_synced_at: new Date().toISOString(),
      suit: 'unclassified', // Google から来たタスクは未分類
    });
    return 'created';
  }

  // 競合解決: Google が新しければ更新
  const googleUpdated = new Date(googleTask.updated);
  const fdcSynced = fdcTask.last_synced_at ? new Date(fdcTask.last_synced_at) : new Date(0);

  if (googleUpdated > fdcSynced) {
    await supabase.from('tasks').update({
      title: googleTask.title,
      description: googleTask.notes,
      status: googleTask.status === 'completed' ? 'done' : 'todo',
      due_date: googleTask.due ? googleTask.due.split('T')[0] : null,
      last_synced_at: new Date().toISOString(),
    }).eq('id', fdcTask.id);
    return 'updated';
  }

  return 'skipped';
}

/**
 * FDC → Google 同期
 */
async function syncFDCToGoogle(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  taskListId: string,
  fdcTask: FDCTask,
  googleTasks: GoogleTask[]
): Promise<'created' | 'updated' | 'skipped'> {
  if (!supabase) return 'skipped';

  const taskData = {
    title: fdcTask.title,
    notes: fdcTask.description || undefined,
    status: fdcTask.status === 'done' ? 'completed' as const : 'needsAction' as const,
    due: fdcTask.due_date ? `${fdcTask.due_date}T00:00:00.000Z` : undefined,
  };

  if (!fdcTask.google_task_id) {
    // Google にない → 新規作成
    const created = await createTask(userId, taskListId, taskData);
    if (created) {
      await supabase.from('tasks').update({
        google_task_id: created.id,
        google_task_list_id: taskListId,
        last_synced_at: new Date().toISOString(),
      }).eq('id', fdcTask.id);
      return 'created';
    }
    return 'skipped';
  }

  // 競合解決: FDC が新しければ更新
  const fdcUpdated = new Date(fdcTask.updated_at);
  const fdcSynced = fdcTask.last_synced_at ? new Date(fdcTask.last_synced_at) : new Date(0);

  if (fdcUpdated > fdcSynced) {
    const googleTask = googleTasks.find((t) => t.id === fdcTask.google_task_id);

    if (googleTask) {
      await updateTask(userId, taskListId, fdcTask.google_task_id, taskData);
      await supabase.from('tasks').update({
        last_synced_at: new Date().toISOString(),
      }).eq('id', fdcTask.id);
      return 'updated';
    }
  }

  return 'skipped';
}

/**
 * 同期状態を取得
 */
export async function getSyncStatus(
  userId: string,
  workspaceId: string
): Promise<{
  status: string;
  lastSyncAt: string | null;
  error: string | null;
  taskListName: string | null;
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { status: 'error', lastSyncAt: null, error: 'Database not configured', taskListName: null };
  }

  const { data } = await supabase
    .from('sync_settings')
    .select('sync_status, last_sync_at, sync_error, google_task_list_name')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single();

  return {
    status: data?.sync_status || 'idle',
    lastSyncAt: data?.last_sync_at || null,
    error: data?.sync_error || null,
    taskListName: data?.google_task_list_name || null,
  };
}
```

### 確認ポイント

- [ ] `lib/server/task-sync.ts` が作成された
- [ ] syncTasks 関数が実装されている
- [ ] Google → FDC, FDC → Google の双方向同期がある
- [ ] Last Write Wins の競合解決が実装されている

---

## Step 5: API Routes 実装

### 5.1 タスクリスト API

**ファイル**: `app/api/google/tasks/lists/route.ts`

```typescript
/**
 * app/api/google/tasks/lists/route.ts
 *
 * Phase 14: Google タスクリスト一覧 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { getTaskLists } from '@/lib/server/google-tasks';

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

    const taskLists = await getTaskLists(session.userId);

    return NextResponse.json({
      taskLists,
      count: taskLists.length,
    });
  } catch (error) {
    console.error('Error in GET /api/google/tasks/lists:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5.2 タスク一覧 API

**ファイル**: `app/api/google/tasks/route.ts`

```typescript
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
```

### 5.3 同期 API

**ファイル**: `app/api/google/tasks/sync/route.ts`

```typescript
/**
 * app/api/google/tasks/sync/route.ts
 *
 * Phase 14: タスク同期 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { syncTasks, getSyncStatus } from '@/lib/server/task-sync';

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
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const status = await getSyncStatus(session.userId, workspaceId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error in GET /api/google/tasks/sync:', error);
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
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const result = await syncTasks(session.userId, workspaceId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/google/tasks/sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 確認ポイント

- [ ] `app/api/google/tasks/lists/route.ts` が作成された
- [ ] `app/api/google/tasks/route.ts` が作成された
- [ ] `app/api/google/tasks/sync/route.ts` が作成された

---

## Step 6: UI コンポーネント実装

### 6.1 同期ボタンコンポーネント

**ファイル**: `app/_components/sync/SyncButton.tsx`

```typescript
/**
 * app/_components/sync/SyncButton.tsx
 *
 * Phase 14: タスク同期ボタン
 */

'use client';

import { useState } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';

interface SyncButtonProps {
  workspaceId: string;
  onSyncComplete?: () => void;
}

export function SyncButton({ workspaceId, onSyncComplete }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch('/api/google/tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await response.json();

      if (data.success) {
        setResult('success');
        onSyncComplete?.();
      } else {
        setResult('error');
        console.error('Sync failed:', data.errors);
      }
    } catch (err) {
      console.error('Sync error:', err);
      setResult('error');
    } finally {
      setSyncing(false);
      // 3秒後に結果表示をクリア
      setTimeout(() => setResult(null), 3000);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 500,
        color: result === 'error' ? 'var(--danger)' : 'var(--primary)',
        background: 'transparent',
        border: `1px solid ${result === 'error' ? 'var(--danger)' : 'var(--primary)'}`,
        borderRadius: '6px',
        cursor: syncing ? 'not-allowed' : 'pointer',
        opacity: syncing ? 0.7 : 1,
      }}
    >
      {syncing ? (
        <>
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
          同期中...
        </>
      ) : result === 'success' ? (
        <>
          <Check size={16} />
          同期完了
        </>
      ) : result === 'error' ? (
        <>
          <AlertCircle size={16} />
          同期エラー
        </>
      ) : (
        <>
          <RefreshCw size={16} />
          Google Tasks と同期
        </>
      )}
    </button>
  );
}
```

### 6.2 同期状態表示コンポーネント

**ファイル**: `app/_components/sync/SyncStatus.tsx`

```typescript
/**
 * app/_components/sync/SyncStatus.tsx
 *
 * Phase 14: 同期状態表示
 */

'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react';

interface SyncStatusProps {
  workspaceId: string;
}

interface SyncStatusData {
  status: string;
  lastSyncAt: string | null;
  error: string | null;
  taskListName: string | null;
}

export function SyncStatus({ workspaceId }: SyncStatusProps) {
  const [data, setData] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    // 30秒ごとに更新
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/google/tasks/sync?workspaceId=${workspaceId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
        読み込み中...
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getStatusIcon = () => {
    switch (data.status) {
      case 'syncing':
        return <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />;
      case 'synced':
        return <Check size={14} />;
      case 'error':
        return <AlertTriangle size={14} />;
      default:
        return <Cloud size={14} />;
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'syncing':
        return 'var(--primary)';
      case 'synced':
        return 'var(--success)';
      case 'error':
        return 'var(--danger)';
      default:
        return 'var(--text-light)';
    }
  };

  const formatLastSync = () => {
    if (!data.lastSyncAt) return '未同期';
    const date = new Date(data.lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: getStatusColor(),
      }}
    >
      {getStatusIcon()}
      <span>
        {data.status === 'syncing' ? '同期中...' : formatLastSync()}
      </span>
      {data.taskListName && (
        <span style={{ color: 'var(--text-muted)' }}>
          ({data.taskListName})
        </span>
      )}
    </div>
  );
}
```

### 6.3 コンポーネントのエクスポート

**ファイル**: `app/_components/sync/index.ts`

```typescript
/**
 * app/_components/sync/index.ts
 *
 * Phase 14: Sync コンポーネントのエクスポート
 */

export { SyncButton } from './SyncButton';
export { SyncStatus } from './SyncStatus';
```

### 確認ポイント

- [ ] `app/_components/sync/SyncButton.tsx` が作成された
- [ ] `app/_components/sync/SyncStatus.tsx` が作成された
- [ ] `app/_components/sync/index.ts` が作成された

---

## Step 7: タスクページに同期機能を追加

### 7.1 タスクページの更新

**ファイル**: `app/(app)/tasks/page.tsx` に追加

```typescript
// 既存のインポートに追加
import { SyncButton, SyncStatus } from '@/app/_components/sync';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';

// コンポーネント内で
const { currentWorkspace } = useWorkspace();

// JSX 内のヘッダー部分に追加
{currentWorkspace && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <SyncStatus workspaceId={currentWorkspace.id} />
    <SyncButton
      workspaceId={currentWorkspace.id}
      onSyncComplete={() => {
        // タスクリストを再読み込み
        fetchTasks();
      }}
    />
  </div>
)}
```

### 確認ポイント

- [ ] タスクページに SyncButton が表示される
- [ ] タスクページに SyncStatus が表示される
- [ ] 同期ボタンをクリックすると同期が実行される

---

## Step 8: ビルド確認

```bash
npm run build
```

### 確認ポイント

- [ ] TypeScript エラーがない
- [ ] ビルドが成功する

---

## トラブルシューティング

### エラー: `Failed to get task list`

**原因**: Google Tasks API へのアクセス権限がない

**解決方法**:
1. ログインページの scopes に `https://www.googleapis.com/auth/tasks` が含まれているか確認
2. シークレットウィンドウで再ログイン

### エラー: `sync_settings テーブルがない`

**原因**: Step 2 の SQL が実行されていない

**解決方法**:
1. Supabase Dashboard → SQL Editor
2. Step 2.2 の SQL を実行

### 同期が遅い

**原因**: 多数のタスクを順次処理している

**対策**:
- 差分同期の実装（updatedMin パラメータを使用）
- バッチ処理の実装

---

## 完了チェックリスト

### 型定義

- [ ] `lib/types/google-tasks.ts` - Tasks API 型定義
- [ ] GoogleTaskList, GoogleTask 型
- [ ] SyncStatus, SyncResult 型

### データベース

- [ ] tasks テーブルに google_task_id カラム追加
- [ ] tasks テーブルに google_task_list_id カラム追加
- [ ] tasks テーブルに last_synced_at カラム追加
- [ ] tasks テーブルに suit カラム追加
- [ ] sync_settings テーブル作成

### サーバーサイド

- [ ] `lib/server/google-tasks.ts` - Tasks API クライアント
- [ ] `lib/server/task-sync.ts` - 同期サービス

### API Routes

- [ ] `app/api/google/tasks/lists/route.ts` - タスクリスト一覧
- [ ] `app/api/google/tasks/route.ts` - タスク一覧・作成
- [ ] `app/api/google/tasks/sync/route.ts` - 同期実行

### UI コンポーネント

- [ ] `app/_components/sync/SyncButton.tsx` - 同期ボタン
- [ ] `app/_components/sync/SyncStatus.tsx` - 同期状態表示
- [ ] `app/_components/sync/index.ts` - エクスポート

### 機能確認

- [ ] Google タスクリスト一覧が取得できる
- [ ] Google タスク一覧が取得できる
- [ ] FDC → Google 同期が動作する
- [ ] Google → FDC 同期が動作する
- [ ] 競合解決（Last Write Wins）が動作する
- [ ] 同期状態がUIに表示される

### 習得した概念

- [ ] Google Tasks API の使い方
- [ ] 双方向同期の実装
- [ ] Last Write Wins 競合解決
- [ ] 同期状態管理

---

## 次のPhase

Phase 15 では、4象限タスクボード UI を実装します：

- ドラッグ&ドロップで象限間移動
- suit カラムによる分類表示
- リアルタイム更新
