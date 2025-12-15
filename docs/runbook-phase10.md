# Phase 10: Action Map（戦術層）実装

## 概要

FDC 3層アーキテクチャの「戦術層」として、Action Map（施策管理）を実装します。

### 3層アーキテクチャ

```
┌─────────────────────────────────┐
│  OKR（戦略層）                   │  ← Phase 11以降
├─────────────────────────────────┤
│  Action Map（戦術層）← 今回      │  ← Phase 10
├─────────────────────────────────┤
│  Task（実行層）                  │  ← Phase 9完了
└─────────────────────────────────┘
```

### 進捗計算の仕組み

```
ActionMap (進捗: 60%)
  ├─ ActionItem A (進捗: 80%)
  │    ├─ Task 1 [完了]
  │    ├─ Task 2 [完了]
  │    ├─ Task 3 [完了]
  │    ├─ Task 4 [完了]
  │    └─ Task 5 [未完了]
  └─ ActionItem B (進捗: 40%)
       ├─ Task 6 [完了]
       ├─ Task 7 [完了]
       ├─ Task 8 [未完了]
       ├─ Task 9 [未完了]
       └─ Task 10 [未完了]
```

### 習得する概念

- **戦術層**: 戦略（OKR）と実行（Task）をつなぐ中間層
- **ActionMap**: 施策の塊（例: 「新機能開発」「マーケティング施策」）
- **ActionItem**: 施策内の個別作業。複数のTaskと紐付く
- **ロールアップ**: 下位の完了率を上位に集約する計算

---

## Step 1: データベーススキーマ作成

### 1.1 Supabase SQLエディタで実行

```sql
-- ========================================
-- action_maps テーブル
-- ========================================
CREATE TABLE action_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_period_start DATE,
  target_period_end DATE,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_action_maps_workspace_id ON action_maps(workspace_id);
CREATE INDEX idx_action_maps_is_archived ON action_maps(is_archived);

-- RLS有効化
ALTER TABLE action_maps ENABLE ROW LEVEL SECURITY;

-- ========================================
-- action_items テーブル
-- ========================================
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_map_id UUID NOT NULL REFERENCES action_maps(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'blocked', 'done')),
  parent_item_id UUID REFERENCES action_items(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_action_items_action_map_id ON action_items(action_map_id);
CREATE INDEX idx_action_items_workspace_id ON action_items(workspace_id);
CREATE INDEX idx_action_items_parent_item_id ON action_items(parent_item_id);
CREATE INDEX idx_action_items_status ON action_items(status);

-- RLS有効化
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- tasks テーブルに action_item_id 追加
-- ========================================
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS action_item_id UUID REFERENCES action_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_action_item_id ON tasks(action_item_id);
```

### 確認ポイント

- [ ] action_maps テーブルが作成された
- [ ] action_items テーブルが作成された
- [ ] tasks に action_item_id カラムが追加された
- [ ] 各インデックスが作成された

---

## Step 2: 型定義作成

### 2.1 ActionMap型

**ファイル**: `lib/types/action-map.ts`

```typescript
/**
 * lib/types/action-map.ts
 *
 * Phase 10: Action Map（戦術層）型定義
 */

import { z } from 'zod';

// ========================================
// ActionItem ステータス・優先度
// ========================================

export const ActionItemStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'blocked',
  'done',
]);
export type ActionItemStatus = z.infer<typeof ActionItemStatusSchema>;

export const ACTION_ITEM_STATUS_LABELS: Record<ActionItemStatus, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  blocked: 'ブロック中',
  done: '完了',
};

export const ACTION_ITEM_STATUS_COLORS: Record<ActionItemStatus, string> = {
  not_started: '#9ca3af',
  in_progress: '#3b82f6',
  blocked: '#ef4444',
  done: '#22c55e',
};

export const ActionItemPrioritySchema = z.enum(['low', 'medium', 'high']);
export type ActionItemPriority = z.infer<typeof ActionItemPrioritySchema>;

export const ACTION_ITEM_PRIORITY_LABELS: Record<ActionItemPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

export const ACTION_ITEM_PRIORITY_COLORS: Record<ActionItemPriority, string> = {
  low: '#9ca3af',
  medium: '#f59e0b',
  high: '#ef4444',
};

// ========================================
// ActionMap
// ========================================

export interface ActionMap {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  targetPeriodStart?: string;
  targetPeriodEnd?: string;
  isArchived: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  // 計算フィールド
  progressRate?: number;
  itemCount?: number;
  completedItemCount?: number;
}

export const CreateActionMapInputSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  targetPeriodStart: z.string().optional(),
  targetPeriodEnd: z.string().optional(),
});

export type CreateActionMapInput = z.infer<typeof CreateActionMapInputSchema>;

export const UpdateActionMapInputSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  targetPeriodStart: z.string().nullable().optional(),
  targetPeriodEnd: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
  version: z.number().optional(), // 楽観ロック用
});

export type UpdateActionMapInput = z.infer<typeof UpdateActionMapInputSchema>;

// ========================================
// ActionItem
// ========================================

export interface ActionItem {
  id: string;
  actionMapId: string;
  workspaceId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: ActionItemPriority;
  status: ActionItemStatus;
  parentItemId?: string;
  sortOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  // 計算フィールド
  progressRate?: number;
  taskCount?: number;
  completedTaskCount?: number;
  linkedTaskIds?: string[];
}

export const CreateActionItemInputSchema = z.object({
  actionMapId: z.string().uuid(),
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: ActionItemPrioritySchema.optional().default('medium'),
  status: ActionItemStatusSchema.optional().default('not_started'),
  parentItemId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateActionItemInput = z.infer<typeof CreateActionItemInputSchema>;

export const UpdateActionItemInputSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: ActionItemPrioritySchema.optional(),
  status: ActionItemStatusSchema.optional(),
  parentItemId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().optional(),
  version: z.number().optional(),
});

export type UpdateActionItemInput = z.infer<typeof UpdateActionItemInputSchema>;

// ========================================
// 進捗計算ヘルパー
// ========================================

/**
 * ActionItemの進捗率を計算（紐付いたTaskから）
 */
export function calculateItemProgress(
  completedTaskCount: number,
  totalTaskCount: number
): number {
  if (totalTaskCount === 0) return 0;
  return Math.round((completedTaskCount / totalTaskCount) * 100);
}

/**
 * ActionMapの進捗率を計算（子ActionItemから）
 */
export function calculateMapProgress(items: ActionItem[]): number {
  if (items.length === 0) return 0;

  const totalProgress = items.reduce((sum, item) => {
    return sum + (item.progressRate ?? 0);
  }, 0);

  return Math.round(totalProgress / items.length);
}

/**
 * ActionItemをツリー構造に変換
 */
export function buildItemTree(items: ActionItem[]): ActionItem[] {
  const itemMap = new Map<string, ActionItem & { children?: ActionItem[] }>();
  const roots: (ActionItem & { children?: ActionItem[] })[] = [];

  // まずすべてのアイテムをマップに登録
  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // 親子関係を構築
  items.forEach((item) => {
    const node = itemMap.get(item.id)!;
    if (item.parentItemId && itemMap.has(item.parentItemId)) {
      const parent = itemMap.get(item.parentItemId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // sortOrderでソート
  const sortByOrder = (a: ActionItem, b: ActionItem) => a.sortOrder - b.sortOrder;
  roots.sort(sortByOrder);
  itemMap.forEach((node) => {
    if (node.children) {
      node.children.sort(sortByOrder);
    }
  });

  return roots;
}
```

### 確認ポイント

- [ ] ActionItemStatus, ActionItemPriority が定義されている
- [ ] ActionMap, ActionItem インターフェースが定義されている
- [ ] Create/Update スキーマが定義されている
- [ ] 進捗計算ヘルパーが実装されている

---

## Step 3: Task型にactionItemId追加

### 3.1 Task型更新

**ファイル**: `lib/types/task.ts`

Task インターフェースに `actionItemId` フィールドを追加：

```typescript
// 既存のTask interfaceに追加
export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  suit?: Suit;
  scheduledDate?: string;
  startAt?: string;
  durationMinutes?: number;
  dueDate?: string;
  priority?: number;
  subTasks?: SubTask[];
  status: TaskStatus;
  actionItemId?: string;  // ← 追加
  linkedActionItemIds?: string[];
  updatedAt: string;
  createdAt: string;
}

// CreateTaskInputSchemaにも追加
export const CreateTaskInputSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  status: TaskStatusSchema.optional().default('not_started'),
  suit: SuitSchema.optional(),
  scheduledDate: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.number().int().min(0).max(3).optional(),
  actionItemId: z.string().uuid().optional(),  // ← 追加
});

// UpdateTaskInputSchemaにも追加
export const UpdateTaskInputSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: TaskStatusSchema.optional(),
  suit: SuitSchema.nullable().optional(),
  scheduledDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.number().int().min(0).max(3).nullable().optional(),
  actionItemId: z.string().uuid().nullable().optional(),  // ← 追加
});
```

### 確認ポイント

- [ ] Task に actionItemId が追加されている
- [ ] CreateTaskInputSchema に actionItemId が追加されている
- [ ] UpdateTaskInputSchema に actionItemId が追加されている

---

## Step 4: ActionMap API実装

### 4.1 ActionMaps API

**ファイル**: `app/api/workspaces/[workspaceId]/action-maps/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/action-maps/route.ts
 *
 * Phase 10: ActionMap API
 * GET  - ActionMap一覧取得（進捗率計算付き）
 * POST - ActionMap作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateActionMapInputSchema } from '@/lib/types/action-map';

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

// GET: ActionMap一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // ActionMaps取得
    let query = supabase
      .from('action_maps')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data: mapsData, error: mapsError } = await query;

    if (mapsError) {
      console.error('Error fetching action maps:', mapsError);
      return NextResponse.json({ error: mapsError.message }, { status: 500 });
    }

    // 各ActionMapの進捗率を計算
    const maps = await Promise.all(
      (mapsData || []).map(async (m) => {
        // ActionItems取得
        const { data: items } = await supabase
          .from('action_items')
          .select('id, status')
          .eq('action_map_id', m.id);

        const itemCount = items?.length || 0;
        const completedItemCount = items?.filter((i) => i.status === 'done').length || 0;
        const progressRate = itemCount > 0
          ? Math.round((completedItemCount / itemCount) * 100)
          : 0;

        return {
          id: m.id,
          workspaceId: m.workspace_id,
          title: m.title,
          description: m.description,
          targetPeriodStart: m.target_period_start,
          targetPeriodEnd: m.target_period_end,
          isArchived: m.is_archived,
          version: m.version,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
          progressRate,
          itemCount,
          completedItemCount,
        };
      })
    );

    return NextResponse.json(maps);
  } catch (error) {
    console.error('Error in GET /action-maps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: ActionMap作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = CreateActionMapInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const { data, error } = await supabase
      .from('action_maps')
      .insert({
        workspace_id: workspaceId,
        title: input.title,
        description: input.description ?? null,
        target_period_start: input.targetPeriodStart ?? null,
        target_period_end: input.targetPeriodEnd ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating action map:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const actionMap = {
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title,
      description: data.description,
      targetPeriodStart: data.target_period_start,
      targetPeriodEnd: data.target_period_end,
      isArchived: data.is_archived,
      version: data.version,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progressRate: 0,
      itemCount: 0,
      completedItemCount: 0,
    };

    return NextResponse.json(actionMap, { status: 201 });
  } catch (error) {
    console.error('Error in POST /action-maps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.2 個別ActionMap API

**ファイル**: `app/api/workspaces/[workspaceId]/action-maps/[mapId]/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/action-maps/[mapId]/route.ts
 *
 * Phase 10: 個別ActionMap API
 * GET    - ActionMap取得（ActionItems含む）
 * PATCH  - ActionMap更新
 * DELETE - ActionMap削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { UpdateActionMapInputSchema } from '@/lib/types/action-map';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; mapId: string }>;
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

// GET: ActionMap取得（ActionItems含む）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    // ActionMap取得
    const { data: mapData, error: mapError } = await supabase
      .from('action_maps')
      .select('*')
      .eq('id', mapId)
      .eq('workspace_id', workspaceId)
      .single();

    if (mapError) {
      if (mapError.code === 'PGRST116') {
        return NextResponse.json({ error: 'ActionMap not found' }, { status: 404 });
      }
      return NextResponse.json({ error: mapError.message }, { status: 500 });
    }

    // ActionItems取得
    const { data: itemsData } = await supabase
      .from('action_items')
      .select('*')
      .eq('action_map_id', mapId)
      .order('sort_order', { ascending: true });

    // 各ActionItemの進捗計算
    const items = await Promise.all(
      (itemsData || []).map(async (item) => {
        // 紐付いたTask取得
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('action_item_id', item.id);

        const taskCount = tasks?.length || 0;
        const completedTaskCount = tasks?.filter((t) => t.status === 'done').length || 0;
        const progressRate = taskCount > 0
          ? Math.round((completedTaskCount / taskCount) * 100)
          : (item.status === 'done' ? 100 : 0);

        return {
          id: item.id,
          actionMapId: item.action_map_id,
          workspaceId: item.workspace_id,
          title: item.title,
          description: item.description,
          dueDate: item.due_date,
          priority: item.priority,
          status: item.status,
          parentItemId: item.parent_item_id,
          sortOrder: item.sort_order,
          version: item.version,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          progressRate,
          taskCount,
          completedTaskCount,
          linkedTaskIds: tasks?.map((t) => t.id) || [],
        };
      })
    );

    // ActionMap進捗計算
    const itemCount = items.length;
    const completedItemCount = items.filter((i) => i.status === 'done').length;
    const progressRate = itemCount > 0
      ? Math.round(items.reduce((sum, i) => sum + (i.progressRate || 0), 0) / itemCount)
      : 0;

    const actionMap = {
      id: mapData.id,
      workspaceId: mapData.workspace_id,
      title: mapData.title,
      description: mapData.description,
      targetPeriodStart: mapData.target_period_start,
      targetPeriodEnd: mapData.target_period_end,
      isArchived: mapData.is_archived,
      version: mapData.version,
      createdAt: mapData.created_at,
      updatedAt: mapData.updated_at,
      progressRate,
      itemCount,
      completedItemCount,
      items,
    };

    return NextResponse.json(actionMap);
  } catch (error) {
    console.error('Error in GET /action-maps/[mapId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: ActionMap更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = UpdateActionMapInputSchema.safeParse(body);

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
    if (input.targetPeriodStart !== undefined) updateData.target_period_start = input.targetPeriodStart;
    if (input.targetPeriodEnd !== undefined) updateData.target_period_end = input.targetPeriodEnd;
    if (input.isArchived !== undefined) updateData.is_archived = input.isArchived;

    // 楽観ロック: versionをインクリメント
    updateData.version = supabase.rpc ? undefined : 1; // 簡易版

    const { data, error } = await supabase
      .from('action_maps')
      .update(updateData)
      .eq('id', mapId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'ActionMap not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const actionMap = {
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title,
      description: data.description,
      targetPeriodStart: data.target_period_start,
      targetPeriodEnd: data.target_period_end,
      isArchived: data.is_archived,
      version: data.version,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(actionMap);
  } catch (error) {
    console.error('Error in PATCH /action-maps/[mapId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: ActionMap削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { error } = await supabase
      .from('action_maps')
      .delete()
      .eq('id', mapId)
      .eq('workspace_id', workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /action-maps/[mapId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 確認ポイント

- [ ] GET /action-maps で一覧取得できる
- [ ] POST /action-maps で作成できる
- [ ] GET /action-maps/[mapId] で詳細取得できる
- [ ] PATCH /action-maps/[mapId] で更新できる
- [ ] DELETE /action-maps/[mapId] で削除できる

---

## Step 5: ActionItem API実装

### 5.1 ActionItems API

**ファイル**: `app/api/workspaces/[workspaceId]/action-maps/[mapId]/items/route.ts`

```typescript
/**
 * app/api/workspaces/[workspaceId]/action-maps/[mapId]/items/route.ts
 *
 * Phase 10: ActionItem API
 * GET  - ActionItem一覧取得
 * POST - ActionItem作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { validateSession } from '@/lib/server/auth';
import { CreateActionItemInputSchema } from '@/lib/types/action-map';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ workspaceId: string; mapId: string }>;
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

// GET: ActionItem一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .eq('action_map_id', mapId)
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching action items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 各Itemの進捗計算
    const items = await Promise.all(
      (data || []).map(async (item) => {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('action_item_id', item.id);

        const taskCount = tasks?.length || 0;
        const completedTaskCount = tasks?.filter((t) => t.status === 'done').length || 0;
        const progressRate = taskCount > 0
          ? Math.round((completedTaskCount / taskCount) * 100)
          : (item.status === 'done' ? 100 : 0);

        return {
          id: item.id,
          actionMapId: item.action_map_id,
          workspaceId: item.workspace_id,
          title: item.title,
          description: item.description,
          dueDate: item.due_date,
          priority: item.priority,
          status: item.status,
          parentItemId: item.parent_item_id,
          sortOrder: item.sort_order,
          version: item.version,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          progressRate,
          taskCount,
          completedTaskCount,
        };
      })
    );

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error in GET /action-maps/[mapId]/items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: ActionItem作成
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, mapId } = await params;
    const auth = await checkAuth(request, workspaceId);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { supabase } = auth;

    const body = await request.json();
    const parsed = CreateActionItemInputSchema.safeParse({
      ...body,
      actionMapId: mapId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // sortOrder を自動計算
    const { data: existingItems } = await supabase
      .from('action_items')
      .select('sort_order')
      .eq('action_map_id', mapId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = (existingItems?.[0]?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('action_items')
      .insert({
        action_map_id: mapId,
        workspace_id: workspaceId,
        title: input.title,
        description: input.description ?? null,
        due_date: input.dueDate ?? null,
        priority: input.priority ?? 'medium',
        status: input.status ?? 'not_started',
        parent_item_id: input.parentItemId ?? null,
        sort_order: input.sortOrder ?? nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating action item:', error);
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
      progressRate: 0,
      taskCount: 0,
      completedTaskCount: 0,
    };

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error in POST /action-maps/[mapId]/items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5.2 個別ActionItem API

**ファイル**: `app/api/workspaces/[workspaceId]/action-maps/[mapId]/items/[itemId]/route.ts`

```typescript
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
```

### 確認ポイント

- [ ] GET /action-maps/[mapId]/items で一覧取得できる
- [ ] POST /action-maps/[mapId]/items で作成できる
- [ ] PATCH /action-maps/[mapId]/items/[itemId] で更新できる
- [ ] DELETE /action-maps/[mapId]/items/[itemId] で削除できる

---

## Step 6: ActionMapContext実装

### 6.1 ActionMapContext

**ファイル**: `lib/contexts/ActionMapContext.tsx`

```typescript
/**
 * lib/contexts/ActionMapContext.tsx
 *
 * Phase 10: ActionMap コンテキスト
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
  ActionMap,
  ActionItem,
  CreateActionMapInput,
  UpdateActionMapInput,
  CreateActionItemInput,
  UpdateActionItemInput,
} from '@/lib/types/action-map';

interface ActionMapContextValue {
  // 状態
  actionMaps: ActionMap[];
  selectedMap: (ActionMap & { items: ActionItem[] }) | null;
  loading: boolean;
  error: string | null;

  // ActionMap アクション
  createMap: (input: CreateActionMapInput) => Promise<ActionMap | null>;
  updateMap: (id: string, input: UpdateActionMapInput) => Promise<ActionMap | null>;
  deleteMap: (id: string) => Promise<void>;
  selectMap: (id: string) => Promise<void>;
  archiveMap: (id: string) => Promise<void>;

  // ActionItem アクション
  createItem: (mapId: string, input: Omit<CreateActionItemInput, 'actionMapId'>) => Promise<ActionItem | null>;
  updateItem: (mapId: string, itemId: string, input: UpdateActionItemInput) => Promise<ActionItem | null>;
  deleteItem: (mapId: string, itemId: string) => Promise<void>;

  // リロード
  reloadMaps: () => Promise<void>;
}

const ActionMapContext = createContext<ActionMapContextValue | null>(null);

export function ActionMapProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [actionMaps, setActionMaps] = useState<ActionMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<(ActionMap & { items: ActionItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = workspace?.id;

  // ActionMap一覧取得
  const fetchMaps = useCallback(async () => {
    if (!workspaceId) return [];

    const res = await fetch(`/api/workspaces/${workspaceId}/action-maps`);
    if (!res.ok) return [];
    return res.json();
  }, [workspaceId]);

  // 初期読み込み
  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const loadMaps = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchMaps();
        setActionMaps(data);
      } catch (err) {
        console.error('Error loading action maps:', err);
        setError('ActionMapの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadMaps();
  }, [workspaceId, fetchMaps]);

  // ActionMap選択（詳細取得）
  const selectMap = useCallback(async (id: string) => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setSelectedMap(data);
    } catch (err) {
      console.error('Error selecting map:', err);
      setError('ActionMapの取得に失敗しました');
    }
  }, [workspaceId]);

  // ActionMap作成
  const createMap = useCallback(async (input: CreateActionMapInput): Promise<ActionMap | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to create');

      const newMap = await res.json();
      setActionMaps((prev) => [newMap, ...prev]);
      return newMap;
    } catch (err) {
      console.error('Error creating map:', err);
      setError('ActionMapの作成に失敗しました');
      return null;
    }
  }, [workspaceId]);

  // ActionMap更新
  const updateMap = useCallback(async (id: string, input: UpdateActionMapInput): Promise<ActionMap | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();
      setActionMaps((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      return updated;
    } catch (err) {
      console.error('Error updating map:', err);
      setError('ActionMapの更新に失敗しました');
      return null;
    }
  }, [workspaceId]);

  // ActionMap削除
  const deleteMap = useCallback(async (id: string): Promise<void> => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setActionMaps((prev) => prev.filter((m) => m.id !== id));
      if (selectedMap?.id === id) {
        setSelectedMap(null);
      }
    } catch (err) {
      console.error('Error deleting map:', err);
      setError('ActionMapの削除に失敗しました');
    }
  }, [workspaceId, selectedMap]);

  // ActionMapアーカイブ
  const archiveMap = useCallback(async (id: string): Promise<void> => {
    await updateMap(id, { isArchived: true });
  }, [updateMap]);

  // ActionItem作成
  const createItem = useCallback(async (
    mapId: string,
    input: Omit<CreateActionItemInput, 'actionMapId'>
  ): Promise<ActionItem | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${mapId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to create');

      const newItem = await res.json();

      // selectedMapを更新
      if (selectedMap?.id === mapId) {
        setSelectedMap((prev) => prev ? {
          ...prev,
          items: [...prev.items, newItem],
        } : null);
      }

      return newItem;
    } catch (err) {
      console.error('Error creating item:', err);
      setError('ActionItemの作成に失敗しました');
      return null;
    }
  }, [workspaceId, selectedMap]);

  // ActionItem更新
  const updateItem = useCallback(async (
    mapId: string,
    itemId: string,
    input: UpdateActionItemInput
  ): Promise<ActionItem | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${mapId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();

      // selectedMapを更新
      if (selectedMap?.id === mapId) {
        setSelectedMap((prev) => prev ? {
          ...prev,
          items: prev.items.map((i) => (i.id === itemId ? { ...i, ...updated } : i)),
        } : null);
      }

      return updated;
    } catch (err) {
      console.error('Error updating item:', err);
      setError('ActionItemの更新に失敗しました');
      return null;
    }
  }, [workspaceId, selectedMap]);

  // ActionItem削除
  const deleteItem = useCallback(async (mapId: string, itemId: string): Promise<void> => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${mapId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      // selectedMapを更新
      if (selectedMap?.id === mapId) {
        setSelectedMap((prev) => prev ? {
          ...prev,
          items: prev.items.filter((i) => i.id !== itemId),
        } : null);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('ActionItemの削除に失敗しました');
    }
  }, [workspaceId, selectedMap]);

  // リロード
  const reloadMaps = useCallback(async () => {
    const data = await fetchMaps();
    setActionMaps(data);
  }, [fetchMaps]);

  return (
    <ActionMapContext.Provider
      value={{
        actionMaps,
        selectedMap,
        loading,
        error,
        createMap,
        updateMap,
        deleteMap,
        selectMap,
        archiveMap,
        createItem,
        updateItem,
        deleteItem,
        reloadMaps,
      }}
    >
      {children}
    </ActionMapContext.Provider>
  );
}

export function useActionMaps() {
  const context = useContext(ActionMapContext);
  if (!context) {
    throw new Error('useActionMaps must be used within ActionMapProvider');
  }
  return context;
}
```

### 確認ポイント

- [ ] ActionMapProvider が実装されている
- [ ] useActionMaps フックが実装されている
- [ ] CRUD操作がすべて実装されている

---

## Step 7: Task API更新（actionItemId対応）

### 7.1 Tasks APIにactionItemId追加

**ファイル**: `app/api/workspaces/[workspaceId]/tasks/route.ts`

POSTハンドラーを更新して `action_item_id` を保存：

```typescript
// POST内のinsert部分を更新
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
    action_item_id: input.actionItemId ?? null,  // ← 追加
  })
  .select()
  .single();

// レスポンスにも追加
const task = {
  // ... 既存フィールド
  actionItemId: data.action_item_id,  // ← 追加
};
```

**ファイル**: `app/api/workspaces/[workspaceId]/tasks/[taskId]/route.ts`

PATCHハンドラーを更新：

```typescript
// PATCH内のupdateData部分を更新
if (input.actionItemId !== undefined) updateData.action_item_id = input.actionItemId;
```

### 確認ポイント

- [ ] タスク作成時にactionItemIdを設定できる
- [ ] タスク更新時にactionItemIdを変更できる

---

## Step 8: UIコンポーネント実装

### 8.1 ActionMapCard

**ファイル**: `app/_components/action-map/ActionMapCard.tsx`

```typescript
/**
 * app/_components/action-map/ActionMapCard.tsx
 *
 * Phase 10: ActionMap カード
 */

'use client';

import { Archive, ChevronRight, MoreHorizontal } from 'lucide-react';
import type { ActionMap } from '@/lib/types/action-map';

interface ActionMapCardProps {
  map: ActionMap;
  onClick: () => void;
  onArchive: () => void;
}

export function ActionMapCard({ map, onClick, onArchive }: ActionMapCardProps) {
  const progressRate = map.progressRate ?? 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            {map.title}
          </h3>
          {map.description && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-light)' }}>
              {map.description}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--text-light)',
          }}
          title="アーカイブ"
        >
          <Archive size={16} />
        </button>
      </div>

      {/* プログレスバー */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
            進捗: {map.completedItemCount}/{map.itemCount} アイテム
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>
            {progressRate}%
          </span>
        </div>
        <div
          style={{
            height: '6px',
            background: '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressRate}%`,
              background: progressRate === 100 ? '#22c55e' : '#3b82f6',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* 期間 */}
      {(map.targetPeriodStart || map.targetPeriodEnd) && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-light)' }}>
          {map.targetPeriodStart} 〜 {map.targetPeriodEnd}
        </div>
      )}

      {/* 詳細へ */}
      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          color: 'var(--primary)',
          fontSize: '13px',
        }}
      >
        詳細を見る
        <ChevronRight size={16} />
      </div>
    </div>
  );
}
```

### 8.2 ActionItemRow

**ファイル**: `app/_components/action-map/ActionItemRow.tsx`

```typescript
/**
 * app/_components/action-map/ActionItemRow.tsx
 *
 * Phase 10: ActionItem 行
 */

'use client';

import { Check, ChevronDown, ChevronRight, Link, Trash2 } from 'lucide-react';
import type { ActionItem, ActionItemStatus } from '@/lib/types/action-map';
import {
  ACTION_ITEM_STATUS_LABELS,
  ACTION_ITEM_STATUS_COLORS,
  ACTION_ITEM_PRIORITY_LABELS,
  ACTION_ITEM_PRIORITY_COLORS,
} from '@/lib/types/action-map';

interface ActionItemRowProps {
  item: ActionItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: ActionItemStatus) => void;
  onDelete: () => void;
  onLinkTask: () => void;
  depth?: number;
}

export function ActionItemRow({
  item,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  onDelete,
  onLinkTask,
  depth = 0,
}: ActionItemRowProps) {
  const progressRate = item.progressRate ?? 0;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '12px 16px',
        marginLeft: depth * 24,
        marginBottom: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* 展開ボタン（子がある場合） */}
        <button
          onClick={onToggleExpand}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--text-light)',
          }}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* チェックボックス */}
        <button
          onClick={() => onStatusChange(item.status === 'done' ? 'not_started' : 'done')}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            border: `2px solid ${ACTION_ITEM_STATUS_COLORS[item.status]}`,
            background: item.status === 'done' ? ACTION_ITEM_STATUS_COLORS.done : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {item.status === 'done' && <Check size={12} color="white" />}
        </button>

        {/* タイトル */}
        <div style={{ flex: 1 }}>
          <span
            style={{
              textDecoration: item.status === 'done' ? 'line-through' : 'none',
              color: item.status === 'done' ? 'var(--text-light)' : 'inherit',
            }}
          >
            {item.title}
          </span>
        </div>

        {/* 優先度 */}
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            background: `${ACTION_ITEM_PRIORITY_COLORS[item.priority]}20`,
            color: ACTION_ITEM_PRIORITY_COLORS[item.priority],
          }}
        >
          {ACTION_ITEM_PRIORITY_LABELS[item.priority]}
        </span>

        {/* 進捗 */}
        <div style={{ width: '60px', textAlign: 'right' }}>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>{progressRate}%</span>
        </div>

        {/* Task数 */}
        <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
          {item.completedTaskCount}/{item.taskCount} tasks
        </span>

        {/* アクション */}
        <button
          onClick={onLinkTask}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--primary)',
          }}
          title="タスクを紐付け"
        >
          <Link size={14} />
        </button>

        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#ef4444',
          }}
          title="削除"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* プログレスバー */}
      <div
        style={{
          marginTop: '8px',
          marginLeft: '52px',
          height: '4px',
          background: '#e5e7eb',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressRate}%`,
            background: progressRate === 100 ? '#22c55e' : '#3b82f6',
          }}
        />
      </div>
    </div>
  );
}
```

### 8.3 エクスポート

**ファイル**: `app/_components/action-map/index.ts`

```typescript
/**
 * app/_components/action-map/index.ts
 *
 * Phase 10: ActionMapコンポーネントエクスポート
 */

export { ActionMapCard } from './ActionMapCard';
export { ActionItemRow } from './ActionItemRow';
```

### 確認ポイント

- [ ] ActionMapCard が実装されている
- [ ] ActionItemRow が実装されている
- [ ] プログレスバーが表示される

---

## Step 9: ビルド確認

```bash
npm run build
```

### 確認ポイント

- [ ] TypeScriptエラーがない
- [ ] ビルドが成功する

---

## 完了チェックリスト

### データベース

- [ ] action_maps テーブルが作成された
- [ ] action_items テーブルが作成された
- [ ] tasks に action_item_id が追加された

### 型定義

- [ ] `lib/types/action-map.ts` が作成された
- [ ] ActionMap, ActionItem 型が定義されている
- [ ] 進捗計算ヘルパーが実装されている

### API

- [ ] GET /api/workspaces/[workspaceId]/action-maps
- [ ] POST /api/workspaces/[workspaceId]/action-maps
- [ ] GET /api/workspaces/[workspaceId]/action-maps/[mapId]
- [ ] PATCH /api/workspaces/[workspaceId]/action-maps/[mapId]
- [ ] DELETE /api/workspaces/[workspaceId]/action-maps/[mapId]
- [ ] GET /api/workspaces/[workspaceId]/action-maps/[mapId]/items
- [ ] POST /api/workspaces/[workspaceId]/action-maps/[mapId]/items
- [ ] PATCH /api/workspaces/[workspaceId]/action-maps/[mapId]/items/[itemId]
- [ ] DELETE /api/workspaces/[workspaceId]/action-maps/[mapId]/items/[itemId]

### Context

- [ ] `lib/contexts/ActionMapContext.tsx` が作成された
- [ ] useActionMaps フックが実装されている

### UIコンポーネント

- [ ] `app/_components/action-map/ActionMapCard.tsx`
- [ ] `app/_components/action-map/ActionItemRow.tsx`
- [ ] `app/_components/action-map/index.ts`

### 機能確認

- [ ] ActionMap の作成・編集・削除
- [ ] ActionItem の作成・編集・削除
- [ ] Task と ActionItem の紐付け
- [ ] 進捗率のボトムアップ計算

### 習得した概念

- [ ] FDC 3層アーキテクチャ（戦術層）
- [ ] ActionMap / ActionItem の階層構造
- [ ] ロールアップによる進捗計算
- [ ] 楽観ロック（version フィールド）

---

## 次のPhase

Phase 11 では「OKR（戦略層）」を実装し、ActionMap と OKR を連携させます。
