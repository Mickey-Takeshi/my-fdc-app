# Phase 9: Eisenhower Matrix（4象限）タスク管理

## 概要

FDC 3層アーキテクチャの「実行層」として、Eisenhower Matrix（4象限）タスク管理を実装します。

### 3層アーキテクチャ
```
┌─────────────────────────────────┐
│  OKR（戦略層）                   │  ← Phase 10以降
├─────────────────────────────────┤
│  Action Map（戦術層）            │  ← Phase 10以降
├─────────────────────────────────┤
│  Task（実行層）← 今回            │  ← Phase 9
└─────────────────────────────────┘
```

### 4象限の意味

| 象限 | Suit | 緊急 | 重要 | 説明 |
|-----|------|------|------|------|
| ♠ Spade | spade | ✓ | ✓ | 今すぐやる締切案件 |
| ♥ Heart | heart | - | ✓ | 習慣化したい重要なこと |
| ♦ Diamond | diamond | ✓ | - | 割り込み・依頼対応 |
| ♣ Club | club | - | - | 20%タイム・実験 |
| 🃏 Joker | undefined | ? | ? | 未分類タスク |

### 習得する概念
- Eisenhower Matrix: 緊急度×重要度の2軸分類
- @dnd-kit/core: React用ドラッグ&ドロップライブラリ
- 実行層: 日々のタスク管理、上位層へのロールアップ

---

## Step 1: Task型の拡張

### 1.1 型定義更新

**ファイル**: `lib/types/task.ts`

```typescript
/**
 * lib/types/task.ts
 *
 * Phase 9: Eisenhower Matrix対応
 * - Suit（4象限）追加
 * - TaskStatus 追加
 */

import { z } from 'zod';

// ========================================
// Suit（4象限）
// ========================================

export const SuitSchema = z.enum(['spade', 'heart', 'diamond', 'club']);
export type Suit = z.infer<typeof SuitSchema>;

export const SUIT_LABELS: Record<Suit, string> = {
  spade: '♠ Spade',
  heart: '♥ Heart',
  diamond: '♦ Diamond',
  club: '♣ Club',
};

export const SUIT_DESCRIPTIONS: Record<Suit, string> = {
  spade: '緊急かつ重要：今すぐやる',
  heart: '重要だが緊急でない：習慣化',
  diamond: '緊急だが重要でない：依頼対応',
  club: '緊急でも重要でもない：実験',
};

export const SUIT_COLORS: Record<Suit, string> = {
  spade: '#1a1a2e',   // 濃紺
  heart: '#e74c3c',   // 赤
  diamond: '#3498db', // 青
  club: '#27ae60',    // 緑
};

// ========================================
// TaskStatus
// ========================================

export const TaskStatusSchema = z.enum(['not_started', 'in_progress', 'done']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '完了',
};

// ========================================
// Task スキーマ
// ========================================

export const TaskSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: TaskStatusSchema,
  suit: SuitSchema.optional(), // undefined = joker/未分類
  scheduledDate: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.number().int().min(0).max(3).optional(),
  linkedActionItemIds: z.array(z.string().uuid()).optional(), // Phase 10で使用
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Task = z.infer<typeof TaskSchema>;

// ========================================
// 作成・更新用スキーマ
// ========================================

export const CreateTaskInputSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  status: TaskStatusSchema.optional().default('not_started'),
  suit: SuitSchema.optional(),
  scheduledDate: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.number().int().min(0).max(3).optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;

export const UpdateTaskInputSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: TaskStatusSchema.optional(),
  suit: SuitSchema.nullable().optional(), // null = jokerに戻す
  scheduledDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.number().int().min(0).max(3).nullable().optional(),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;

// ========================================
// ヘルパー関数
// ========================================

/**
 * タスクをSuitでグループ化
 */
export function groupTasksBySuit(tasks: Task[]): {
  spade: Task[];
  heart: Task[];
  diamond: Task[];
  club: Task[];
  joker: Task[];
} {
  return {
    spade: tasks.filter((t) => t.suit === 'spade'),
    heart: tasks.filter((t) => t.suit === 'heart'),
    diamond: tasks.filter((t) => t.suit === 'diamond'),
    club: tasks.filter((t) => t.suit === 'club'),
    joker: tasks.filter((t) => !t.suit),
  };
}

/**
 * タスクをStatusでグループ化
 */
export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  return {
    not_started: tasks.filter((t) => t.status === 'not_started'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };
}

/**
 * 未完了タスクをフィルター
 */
export function getActiveTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status !== 'done');
}

/**
 * 今日予定のタスクをフィルター
 */
export function getTodayTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter((t) => t.scheduledDate === today);
}
```

### 確認ポイント
- [ ] Suit型が定義されている
- [ ] TaskStatus型が定義されている
- [ ] SUIT_LABELS, SUIT_COLORS が定義されている
- [ ] groupTasksBySuit ヘルパーが実装されている

---

## Step 2: データベーススキーマ更新

### 2.1 tasks テーブル更新SQL

Supabaseで以下のSQLを実行してください：

```sql
-- tasksテーブルにsuit, status カラムを追加（既存テーブルの場合）
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS suit TEXT CHECK (suit IN ('spade', 'heart', 'diamond', 'club')),
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done')),
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 3),
ADD COLUMN IF NOT EXISTS linked_action_item_ids UUID[] DEFAULT '{}';

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_tasks_suit ON tasks(suit);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);

-- 既存タスクのstatusをnot_startedに更新（必要に応じて）
UPDATE tasks SET status = 'not_started' WHERE status IS NULL;
```

### 確認ポイント
- [ ] suit カラムが追加された
- [ ] status カラムが追加された
- [ ] インデックスが作成された

---

## Step 3: Task API更新

### 3.1 Tasks API

**ファイル**: `app/api/workspaces/[workspaceId]/tasks/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/tasks/route.ts
 *
 * Phase 9: Eisenhower Matrix対応
 * GET  - タスク一覧取得（suit, statusフィルター対応）
 * POST - タスク作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateTaskInputSchema } from '@/lib/types/task';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
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

// GET: タスク一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
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

    if ('error' in auth) {
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
```

### 3.2 個別タスクAPI

**ファイル**: `app/api/workspaces/[workspaceId]/tasks/[taskId]/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/tasks/[taskId]/route.ts
 *
 * Phase 9: 個別タスクAPI
 * GET    - タスク取得
 * PATCH  - タスク更新（suit変更対応）
 * DELETE - タスク削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateTaskInputSchema } from '@/lib/types/task';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; taskId: string }>;
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

// GET: タスク取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, taskId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
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

    if ('error' in auth) {
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

    if ('error' in auth) {
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
```

### 確認ポイント
- [ ] GET /tasks でsuitフィルターが動作する
- [ ] PATCH /tasks/[taskId] でsuitが更新できる
- [ ] 認証チェックが正しく動作する

---

## Step 4: TaskContext更新

### 4.1 TaskContext

**ファイル**: `lib/contexts/TaskContext.tsx`

```typescript
/**
 * lib/contexts/TaskContext.tsx
 *
 * Phase 9: Eisenhower Matrix対応
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useWorkspace } from './WorkspaceContext';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  Suit,
  TaskStatus,
} from '@/lib/types/task';
import { groupTasksBySuit, groupTasksByStatus } from '@/lib/types/task';

interface TaskContextValue {
  // 状態
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // グループ化されたタスク
  tasksBySuit: {
    spade: Task[];
    heart: Task[];
    diamond: Task[];
    club: Task[];
    joker: Task[];
  };
  tasksByStatus: Record<TaskStatus, Task[]>;

  // アクション
  addTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<void>;
  moveSuit: (taskId: string, newSuit: Suit | null) => Promise<void>;
  updateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  reloadTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = workspace?.id;

  // タスク読み込み
  const fetchTasks = useCallback(async () => {
    if (!workspaceId) return [];

    const res = await fetch(`/api/workspaces/${workspaceId}/tasks`);
    if (!res.ok) return [];
    return res.json();
  }, [workspaceId]);

  // 初期読み込み
  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const loadTasks = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchTasks();
        setTasks(data);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('タスクの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [workspaceId, fetchTasks]);

  // グループ化
  const tasksBySuit = groupTasksBySuit(tasks);
  const tasksByStatus = groupTasksByStatus(tasks);

  // タスク追加
  const addTask = useCallback(
    async (input: CreateTaskInput): Promise<Task | null> => {
      if (!workspaceId) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error('タスクの作成に失敗しました');
        }

        const newTask = await res.json();
        setTasks((prev) => [newTask, ...prev]);
        return newTask;
      } catch (err) {
        console.error('Error adding task:', err);
        setError('タスクの作成に失敗しました');
        return null;
      }
    },
    [workspaceId]
  );

  // タスク更新
  const updateTask = useCallback(
    async (id: string, input: UpdateTaskInput): Promise<Task | null> => {
      if (!workspaceId) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error('タスクの更新に失敗しました');
        }

        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      } catch (err) {
        console.error('Error updating task:', err);
        setError('タスクの更新に失敗しました');
        return null;
      }
    },
    [workspaceId]
  );

  // タスク削除
  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      if (!workspaceId) return;

      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          throw new Error('タスクの削除に失敗しました');
        }

        setTasks((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        console.error('Error deleting task:', err);
        setError('タスクの削除に失敗しました');
      }
    },
    [workspaceId]
  );

  // Suit移動（ドラッグ&ドロップ用）
  const moveSuit = useCallback(
    async (taskId: string, newSuit: Suit | null): Promise<void> => {
      await updateTask(taskId, { suit: newSuit });
    },
    [updateTask]
  );

  // ステータス更新
  const updateStatus = useCallback(
    async (taskId: string, newStatus: TaskStatus): Promise<void> => {
      await updateTask(taskId, { status: newStatus });
    },
    [updateTask]
  );

  // リロード
  const reloadTasks = useCallback(async (): Promise<void> => {
    if (!workspaceId) return;

    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      console.error('Error reloading tasks:', err);
    }
  }, [workspaceId, fetchTasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        tasksBySuit,
        tasksByStatus,
        addTask,
        updateTask,
        deleteTask,
        moveSuit,
        updateStatus,
        reloadTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within TaskProvider');
  }
  return context;
}
```

### 確認ポイント
- [ ] tasksBySuit が正しくグループ化されている
- [ ] moveSuit でドラッグ&ドロップ移動ができる
- [ ] updateStatus でステータス変更ができる

---

## Step 5: @dnd-kit インストール

### 5.1 パッケージインストール

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 確認ポイント
- [ ] @dnd-kit/core がインストールされている
- [ ] @dnd-kit/sortable がインストールされている

---

## Step 6: UIコンポーネント実装

### 6.1 TaskCard

**ファイル**: `app/_components/tasks/TaskCard.tsx`

```typescript
/**
 * app/_components/tasks/TaskCard.tsx
 *
 * Phase 9: ドラッグ可能なタスクカード
 */

'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Check, Clock, Trash2 } from 'lucide-react';
import type { Task, TaskStatus } from '@/lib/types/task';
import { SUIT_COLORS, TASK_STATUS_LABELS } from '@/lib/types/task';

interface TaskCardProps {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
  onDelete: () => void;
}

export function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const suitColor = task.suit ? SUIT_COLORS[task.suit] : '#888';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'white',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        boxShadow: isDragging
          ? '0 8px 16px rgba(0,0,0,0.2)'
          : '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${suitColor}`,
        cursor: 'grab',
      }}
      {...attributes}
      {...listeners}
    >
      {/* タイトル */}
      <div
        style={{
          fontWeight: 500,
          marginBottom: '8px',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          color: task.status === 'done' ? '#999' : 'inherit',
        }}
      >
        {task.title}
      </div>

      {/* メタ情報 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-light)',
        }}
      >
        {/* ステータス */}
        <span
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background:
              task.status === 'done'
                ? '#e8f5e9'
                : task.status === 'in_progress'
                ? '#fff3e0'
                : '#f5f5f5',
            color:
              task.status === 'done'
                ? '#2e7d32'
                : task.status === 'in_progress'
                ? '#ef6c00'
                : '#666',
          }}
        >
          {TASK_STATUS_LABELS[task.status]}
        </span>

        {/* 予定日 */}
        {task.scheduledDate && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Clock size={12} />
            {task.scheduledDate}
          </span>
        )}

        {/* アクションボタン */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          {task.status !== 'done' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange('done');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#4caf50',
              }}
              title="完了にする"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#f44336',
            }}
            title="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 6.2 QuadrantColumn

**ファイル**: `app/_components/tasks/QuadrantColumn.tsx`

```typescript
/**
 * app/_components/tasks/QuadrantColumn.tsx
 *
 * Phase 9: 4象限カラム
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Task, Suit, TaskStatus } from '@/lib/types/task';
import { SUIT_LABELS, SUIT_DESCRIPTIONS, SUIT_COLORS } from '@/lib/types/task';
import { TaskCard } from './TaskCard';

interface QuadrantColumnProps {
  suit: Suit;
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

export function QuadrantColumn({
  suit,
  tasks,
  onStatusChange,
  onDelete,
}: QuadrantColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `quadrant-${suit}`,
    data: { suit },
  });

  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? '#f0f7ff' : '#fafafa',
        borderRadius: '12px',
        padding: '16px',
        minHeight: '300px',
        border: isOver ? '2px dashed #2196f3' : '2px solid transparent',
        transition: 'all 0.2s',
      }}
    >
      {/* ヘッダー */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              color: SUIT_COLORS[suit],
            }}
          >
            {SUIT_LABELS[suit].split(' ')[0]}
          </span>
          <span style={{ fontWeight: 600 }}>{SUIT_LABELS[suit].split(' ')[1]}</span>
          <span
            style={{
              marginLeft: 'auto',
              background: '#e0e0e0',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
            }}
          >
            {activeTasks.length}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
          {SUIT_DESCRIPTIONS[suit]}
        </div>
      </div>

      {/* 未完了タスク */}
      {activeTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={(status) => onStatusChange(task.id, status)}
          onDelete={() => onDelete(task.id)}
        />
      ))}

      {/* 完了タスク（折りたたみ） */}
      {doneTasks.length > 0 && (
        <details style={{ marginTop: '16px' }}>
          <summary
            style={{
              fontSize: '12px',
              color: 'var(--text-light)',
              cursor: 'pointer',
            }}
          >
            完了済み ({doneTasks.length})
          </summary>
          <div style={{ marginTop: '8px' }}>
            {doneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={(status) => onStatusChange(task.id, status)}
                onDelete={() => onDelete(task.id)}
              />
            ))}
          </div>
        </details>
      )}

      {/* 空状態 */}
      {tasks.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-light)',
            fontSize: '14px',
          }}
        >
          タスクをドラッグしてここに追加
        </div>
      )}
    </div>
  );
}
```

### 6.3 JokerZone

**ファイル**: `app/_components/tasks/JokerZone.tsx`

```typescript
/**
 * app/_components/tasks/JokerZone.tsx
 *
 * Phase 9: 未分類タスク（Joker）ゾーン
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import type { Task, TaskStatus } from '@/lib/types/task';
import { TaskCard } from './TaskCard';

interface JokerZoneProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onAddTask: () => void;
}

export function JokerZone({
  tasks,
  onStatusChange,
  onDelete,
  onAddTask,
}: JokerZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'quadrant-joker',
    data: { suit: null },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? '#fff8e1' : '#fffde7',
        borderRadius: '12px',
        padding: '16px',
        border: isOver ? '2px dashed #ffc107' : '2px solid #fff59d',
        transition: 'all 0.2s',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🃏</span>
            <span style={{ fontWeight: 600 }}>Joker（未分類）</span>
            <span
              style={{
                background: '#ffc107',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            >
              {tasks.length}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
            象限に振り分けてください
          </div>
        </div>

        <button
          onClick={onAddTask}
          className="btn btn-primary btn-small"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={16} />
          タスク追加
        </button>
      </div>

      {/* タスク一覧（横スクロール） */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
        }}
      >
        {tasks.map((task) => (
          <div key={task.id} style={{ minWidth: '250px', maxWidth: '300px' }}>
            <TaskCard
              task={task}
              onStatusChange={(status) => onStatusChange(task.id, status)}
              onDelete={() => onDelete(task.id)}
            />
          </div>
        ))}

        {tasks.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '20px',
              color: 'var(--text-light)',
              fontSize: '14px',
              width: '100%',
            }}
          >
            未分類のタスクはありません
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6.4 EisenhowerBoard（メインコンポーネント）

**ファイル**: `app/_components/tasks/EisenhowerBoard.tsx`

```typescript
/**
 * app/_components/tasks/EisenhowerBoard.tsx
 *
 * Phase 9: Eisenhower Matrix 4象限ボード
 */

'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Plus, X } from 'lucide-react';
import { useTasks } from '@/lib/contexts/TaskContext';
import type { Task, Suit, CreateTaskInput } from '@/lib/types/task';
import { QuadrantColumn } from './QuadrantColumn';
import { JokerZone } from './JokerZone';
import { TaskCard } from './TaskCard';

export function EisenhowerBoard() {
  const {
    tasksBySuit,
    loading,
    error,
    addTask,
    deleteTask,
    moveSuit,
    updateStatus,
  } = useTasks();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // 象限へのドロップ
    if (overId.startsWith('quadrant-')) {
      const newSuit = overId.replace('quadrant-', '') as Suit | 'joker';
      moveSuit(taskId, newSuit === 'joker' ? null : newSuit);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    const input: CreateTaskInput = {
      title: newTaskTitle.trim(),
      status: 'not_started',
      // suit は未設定 = Joker
    };

    await addTask(input);
    setNewTaskTitle('');
    setShowAddForm(false);
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('このタスクを削除しますか？')) {
      await deleteTask(taskId);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>読み込み中...</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>
        {error}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        {/* Jokerゾーン */}
        <div style={{ marginBottom: '24px' }}>
          <JokerZone
            tasks={tasksBySuit.joker}
            onStatusChange={(id, status) => updateStatus(id, status)}
            onDelete={handleDelete}
            onAddTask={() => setShowAddForm(true)}
          />
        </div>

        {/* 4象限グリッド */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          {/* 緊急×重要 */}
          <div>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                color: 'var(--text-light)',
              }}
            >
              緊急 & 重要
            </div>
            <QuadrantColumn
              suit="spade"
              tasks={tasksBySuit.spade}
              onStatusChange={(id, status) => updateStatus(id, status)}
              onDelete={handleDelete}
            />
          </div>

          {/* 非緊急×重要 */}
          <div>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                color: 'var(--text-light)',
              }}
            >
              重要だが緊急でない
            </div>
            <QuadrantColumn
              suit="heart"
              tasks={tasksBySuit.heart}
              onStatusChange={(id, status) => updateStatus(id, status)}
              onDelete={handleDelete}
            />
          </div>

          {/* 緊急×非重要 */}
          <div>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                color: 'var(--text-light)',
              }}
            >
              緊急だが重要でない
            </div>
            <QuadrantColumn
              suit="diamond"
              tasks={tasksBySuit.diamond}
              onStatusChange={(id, status) => updateStatus(id, status)}
              onDelete={handleDelete}
            />
          </div>

          {/* 非緊急×非重要 */}
          <div>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '8px',
                fontSize: '12px',
                color: 'var(--text-light)',
              }}
            >
              緊急でも重要でもない
            </div>
            <QuadrantColumn
              suit="club"
              tasks={tasksBySuit.club}
              onStatusChange={(id, status) => updateStatus(id, status)}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* ドラッグオーバーレイ */}
        <DragOverlay>
          {activeTask && (
            <div style={{ width: '280px' }}>
              <TaskCard
                task={activeTask}
                onStatusChange={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}
        </DragOverlay>

        {/* タスク追加モーダル */}
        {showAddForm && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowAddForm(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                width: '90%',
                maxWidth: '400px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h3 style={{ margin: 0 }}>新しいタスク</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="タスク名を入力..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  キャンセル
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                >
                  <Plus size={16} />
                  追加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
```

### 6.5 エクスポート

**ファイル**: `app/_components/tasks/index.ts`

```typescript
/**
 * app/_components/tasks/index.ts
 *
 * Phase 9: タスクコンポーネントエクスポート
 */

export { TaskCard } from './TaskCard';
export { QuadrantColumn } from './QuadrantColumn';
export { JokerZone } from './JokerZone';
export { EisenhowerBoard } from './EisenhowerBoard';
```

### 確認ポイント
- [ ] TaskCardがドラッグ可能
- [ ] QuadrantColumnがドロップを受け付ける
- [ ] JokerZoneが未分類タスクを表示
- [ ] EisenhowerBoardで4象限が表示される

---

## Step 7: タスクページ更新

### 7.1 タスクページ

**ファイル**: `app/(app)/tasks/page.tsx`

```typescript
/**
 * app/(app)/tasks/page.tsx
 *
 * Phase 9: Eisenhower Matrix タスクページ
 */

'use client';

import { TaskProvider } from '@/lib/contexts/TaskContext';
import { EisenhowerBoard } from '@/app/_components/tasks';

function TasksPageContent() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>タスク管理</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
        タスクをドラッグして4象限に振り分けてください。
        緊急度と重要度に応じて優先順位を決めましょう。
      </p>
      <EisenhowerBoard />
    </div>
  );
}

export default function TasksPage() {
  return (
    <TaskProvider>
      <TasksPageContent />
    </TaskProvider>
  );
}
```

### 確認ポイント
- [ ] /tasks ページにアクセスできる
- [ ] 4象限ボードが表示される
- [ ] タスクの追加・削除ができる
- [ ] ドラッグ&ドロップで象限移動ができる

---

## Step 8: ビルド確認

```bash
npm run build
```

### 確認ポイント
- [ ] TypeScriptエラーがない
- [ ] ビルドが成功する

---

## 完了チェックリスト

### 機能確認

- [ ] タスク作成（Jokerゾーン）
- [ ] タスク削除
- [ ] ステータス変更（未着手→完了）
- [ ] ドラッグ&ドロップで象限移動
- [ ] Joker → 各象限への振り分け
- [ ] 各象限 → Jokerへの戻し
- [ ] 象限間の移動

### ファイル作成確認

- [ ] `lib/types/task.ts` - 型定義更新
- [ ] `lib/contexts/TaskContext.tsx` - コンテキスト更新
- [ ] `app/api/workspaces/[workspaceId]/tasks/route.ts` - API
- [ ] `app/api/workspaces/[workspaceId]/tasks/[taskId]/route.ts` - 個別API
- [ ] `app/_components/tasks/TaskCard.tsx`
- [ ] `app/_components/tasks/QuadrantColumn.tsx`
- [ ] `app/_components/tasks/JokerZone.tsx`
- [ ] `app/_components/tasks/EisenhowerBoard.tsx`
- [ ] `app/_components/tasks/index.ts`
- [ ] `app/(app)/tasks/page.tsx` - ページ更新

### 習得した概念

- [ ] FDC 3層アーキテクチャ（OKR → Action Map → Task）
- [ ] Eisenhower Matrix（4象限による優先度分類）
- [ ] @dnd-kit によるドラッグ&ドロップ実装
- [ ] useDroppable / useDraggable フック

---

## 次のPhase

Phase 10 では「Action Map（戦術層）」を実装し、タスクと上位目標を連携させます。
