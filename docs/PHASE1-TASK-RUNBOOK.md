# Phase 1 ランブック: タスク管理機能

**バージョン:** v1.0.0
**作成日:** 2025-12-07
**前提:** Phase 0 完了（スターター起動済み）

---

## 0. 前提条件

- [x] Phase 0 完了（`npm run dev` で http://localhost:3000 にアクセス可能）
- [x] 必読ドキュメント確認済み

---

## 1. 実装サマリー

| # | 実装内容 | ファイル | 優先度 |
|---|---------|---------|--------|
| 1 | Task 型定義 | `lib/types/task.ts` | P0 |
| 2 | DataContext（useReducer） | `lib/contexts/TaskContext.tsx` | P0 |
| 3 | タスクページ /tasks | `app/(app)/tasks/page.tsx` | P0 |
| 4 | 4象限ボード | `app/_components/task/TodoBoard.tsx` | P0 |
| 5 | タスクカード | `app/_components/task/TodoCard.tsx` | P0 |
| 6 | タブコンテナ | `app/_components/task/TaskBoardTab.tsx` | P0 |
| 7 | 作成/編集モーダル | `app/_components/task/TaskFormModal.tsx` | P1 |
| 8 | フィルター機能 | TaskBoardTab 内に実装 | P1 |
| 9 | ダッシュボード統計 | `app/(app)/dashboard/` | P2 |
| 10 | localStorage 永続化 | TaskContext 内に実装 | P1 |

---

## 2. 型定義

### 2.1 Task 型（`lib/types/task.ts`）

```typescript
/**
 * lib/types/task.ts
 *
 * タスク関連の型定義
 * - 4象限（アイゼンハワーマトリクス）
 * - タスク本体
 * - サブタスク
 */

// ========================================
// 4象限（アイゼンハワーマトリクス）
// ========================================

/**
 * 4象限のスート定義
 * - spade: 緊急かつ重要（Do First）→ 黒
 * - heart: 重要なこと（Schedule）→ 赤
 * - diamond: 緊急なだけ（Delegate）→ 黄
 * - club: 未来創造（Create Future）→ 青
 */
export type Suit = 'spade' | 'heart' | 'diamond' | 'club';

/**
 * スート設定（UI表示用）
 */
export const SUIT_CONFIG: Record<Suit, {
  ja: string;
  en: string;
  color: string;
  symbol: string;
}> = {
  spade: {
    ja: 'すぐやる',
    en: 'Do Now',
    color: '#000000',
    symbol: '♠',
  },
  heart: {
    ja: '予定に入れ実行',
    en: 'Schedule',
    color: '#DC143C',
    symbol: '♥',
  },
  diamond: {
    ja: '任せる＆自動化',
    en: 'Delegate',
    color: '#FFC107',
    symbol: '♦',
  },
  club: {
    ja: '未来創造20%タイム',
    en: 'Create Future',
    color: '#1976D2',
    symbol: '♣',
  },
};

/**
 * スート絵文字マッピング
 */
export const SUIT_EMOJI: Record<Suit, string> = {
  spade: '⬛',
  heart: '🟥',
  diamond: '🟨',
  club: '🟦',
};

// ========================================
// タスク
// ========================================

export type TaskStatus = 'not_started' | 'in_progress' | 'done';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  suit?: Suit;  // undefined = 分類待ち（ジョーカー）
  scheduledDate?: string;  // YYYY-MM-DD
  startAt?: string;        // "09:00" など
  durationMinutes?: number;
  subTasks?: SubTask[];
  status: TaskStatus;
  updatedAt: number;
  createdAt: number;
}

// ========================================
// ユーティリティ関数
// ========================================

export function createDefaultTask(partial: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: '',
    suit: 'heart',
    status: 'not_started',
    updatedAt: now,
    createdAt: now,
    ...partial,
  };
}

export function groupTasksBySuit(tasks: Task[]): Record<Suit, Task[]> {
  return {
    spade: tasks.filter(t => t.suit === 'spade'),
    heart: tasks.filter(t => t.suit === 'heart'),
    diamond: tasks.filter(t => t.suit === 'diamond'),
    club: tasks.filter(t => t.suit === 'club'),
  };
}
```

---

## 3. DataContext 設計

### 3.1 TaskContext（`lib/contexts/TaskContext.tsx`）

```typescript
/**
 * lib/contexts/TaskContext.tsx
 *
 * タスク管理用Context（useReducer + localStorage永続化）
 */

'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import type { Task, Suit } from '@/lib/types/task';

// ========================================
// State & Actions
// ========================================

interface TaskState {
  tasks: Task[];
  loading: boolean;
}

type TaskAction =
  | { type: 'INIT'; tasks: Task[] }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; id: string; updates: Partial<Task> }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'MOVE_TASK'; id: string; suit: Suit }
  | { type: 'COMPLETE_TASK'; id: string }
  | { type: 'SET_LOADING'; loading: boolean };

// ========================================
// Reducer
// ========================================

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'INIT':
      return { ...state, tasks: action.tasks, loading: false };

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id
            ? { ...t, ...action.updates, updatedAt: Date.now() }
            : t
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.id),
      };

    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id
            ? { ...t, suit: action.suit, updatedAt: Date.now() }
            : t
        ),
      };

    case 'COMPLETE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id
            ? {
                ...t,
                status: t.status === 'done' ? 'not_started' : 'done',
                updatedAt: Date.now(),
              }
            : t
        ),
      };

    case 'SET_LOADING':
      return { ...state, loading: action.loading };

    default:
      return state;
  }
}

// ========================================
// Context
// ========================================

interface TaskContextValue {
  state: TaskState;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, suit: Suit) => void;
  completeTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

// ========================================
// localStorage
// ========================================

const STORAGE_KEY = 'fdc_tasks';

function loadTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    console.warn('[TaskContext] Failed to save tasks');
  }
}

// ========================================
// Provider
// ========================================

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    loading: true,
  });

  // 初期化（localStorage から読み込み）
  useEffect(() => {
    const tasks = loadTasks();
    dispatch({ type: 'INIT', tasks });
  }, []);

  // 永続化（tasks 変更時に localStorage に保存）
  useEffect(() => {
    if (!state.loading) {
      saveTasks(state.tasks);
    }
  }, [state.tasks, state.loading]);

  // アクション関数
  const addTask = (task: Task) => dispatch({ type: 'ADD_TASK', task });
  const updateTask = (id: string, updates: Partial<Task>) =>
    dispatch({ type: 'UPDATE_TASK', id, updates });
  const deleteTask = (id: string) => dispatch({ type: 'DELETE_TASK', id });
  const moveTask = (id: string, suit: Suit) =>
    dispatch({ type: 'MOVE_TASK', id, suit });
  const completeTask = (id: string) => dispatch({ type: 'COMPLETE_TASK', id });

  return (
    <TaskContext.Provider
      value={{
        state,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
        completeTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

// ========================================
// Hook
// ========================================

export function useTaskContext(): TaskContextValue {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
```

---

## 4. コンポーネント構成

### 4.1 ディレクトリ構造

```
app/
├── (app)/
│   └── tasks/
│       └── page.tsx           # タスクページ
├── _components/
│   └── task/
│       ├── index.ts           # re-export
│       ├── TodoBoard.tsx      # 4象限ボード
│       ├── TodoCard.tsx       # タスクカード
│       ├── TaskBoardTab.tsx   # タブコンテナ（フィルター含む）
│       ├── TaskFormModal.tsx  # 作成/編集モーダル
│       └── QuadrantColumn.tsx # 象限カラム
lib/
├── types/
│   └── task.ts                # 型定義
└── contexts/
    └── TaskContext.tsx        # Context
```

### 4.2 TodoBoard コンポーネント

参照: `references/ui/task/TodoBoard.tsx`

**ポイント:**
- `@dnd-kit/core` によるドラッグ&ドロップ
- 4象限を 2x2 グリッドで表示
- Joker ゾーン（未分類タスク）

### 4.3 TodoCard コンポーネント

参照: `references/ui/task/TodoCard.tsx`

**ポイント:**
- スート絵文字表示（⬛🟥🟨🟦）
- 完了チェックボックス
- 削除確認ダイアログ
- ホバーエフェクト

### 4.4 TaskBoardTab コンポーネント

**フィルター機能:**
- ステータス（すべて / 未完了 / 完了）
- 象限（すべて / 各象限）
- 日付（yesterday / today / tomorrow）

---

## 5. 実装手順

### Step 1: 型定義作成 (P0)

```bash
# 1. 型定義ファイル作成
touch lib/types/task.ts
```

上記 §2.1 のコードを実装。

### Step 2: TaskContext 作成 (P0)

```bash
# 2. Context作成
touch lib/contexts/TaskContext.tsx
```

上記 §3.1 のコードを実装。

### Step 3: コンポーネント作成 (P0)

```bash
# 3. コンポーネントディレクトリ作成
mkdir -p app/_components/task
touch app/_components/task/index.ts
touch app/_components/task/TodoBoard.tsx
touch app/_components/task/TodoCard.tsx
touch app/_components/task/TaskBoardTab.tsx
touch app/_components/task/QuadrantColumn.tsx
touch app/_components/task/TaskFormModal.tsx
```

参照ファイルをベースに実装。

### Step 4: タスクページ作成 (P0)

```bash
# 4. タスクページ作成
mkdir -p "app/(app)/tasks"
touch "app/(app)/tasks/page.tsx"
```

### Step 5: 依存パッケージインストール

```bash
# ドラッグ&ドロップ
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# アイコン
npm install lucide-react
```

### Step 6: フィルター機能追加 (P1)

TaskBoardTab 内に以下のフィルター実装:
- ステータスフィルター
- 象限フィルター
- 日付フィルター

### Step 7: ダッシュボード統計 (P2)

```typescript
// ダッシュボード用の統計計算
interface TaskStats {
  total: number;
  completed: number;
  bySuit: Record<Suit, number>;
  todayTasks: number;
}
```

---

## 6. コーディング規約

### 6.1 ファイル命名

- コンポーネント: `PascalCase.tsx`（例: `TodoBoard.tsx`）
- 型定義: `kebab-case.ts` または `camelCase.ts`
- Context: `PascalCaseContext.tsx`

### 6.2 インポート順序

```typescript
// 1. React / Next.js
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// 2. 外部ライブラリ
import { DndContext } from '@dnd-kit/core';
import { Trash2, Clock } from 'lucide-react';

// 3. 内部モジュール
import { useTaskContext } from '@/lib/contexts/TaskContext';

// 4. 型定義
import type { Task, Suit } from '@/lib/types/task';

// 5. スタイル（CSS Modules等）
import styles from './TodoBoard.module.css';
```

### 6.3 TypeScript ルール

- `any` 禁止（型を具体化）
- `strict: true` を維持
- Props に明示的な型定義

---

## 7. 検証チェックリスト

### 7.1 機能検証

- [ ] タスク追加ができる
- [ ] タスク編集ができる
- [ ] タスク削除ができる（確認ダイアログ表示）
- [ ] タスク完了/未完了の切り替えができる
- [ ] ドラッグ&ドロップで象限移動ができる
- [ ] フィルターが正常動作する
- [ ] localStorage に永続化される
- [ ] ページリロード後もデータが保持される

### 7.2 技術検証

```bash
# 型チェック
npm run type-check

# ビルド
npm run build

# Lint
npm run lint

# 開発サーバー起動
npm run dev
```

---

## 8. 参照ドキュメント

| ドキュメント | パス |
|------------|------|
| グランドガイド | `references/saas-docs/FDC-GRAND-GUIDE.md` |
| 開発ガイド | `references/saas-docs/guides/DEVELOPMENT.md` |
| UI参照: TodoBoard | `references/ui/task/TodoBoard.tsx` |
| UI参照: TodoCard | `references/ui/task/TodoCard.tsx` |
| UI参照: TaskBoardTab | `references/ui/task/TaskBoardTab.tsx` |
| UI参照: TaskFormModal | `references/ui/task/TaskFormModal.tsx` |
| 型参照: task.ts | `references/types/task.ts` |
| Context参照 | `references/contexts/WorkspaceDataContext.tsx` |

---

## 9. 完了定義 (Definition of Done)

Phase 1 は以下がすべて満たされたとき完了:

1. **型定義**: `lib/types/task.ts` が作成され、型チェック通過
2. **Context**: `lib/contexts/TaskContext.tsx` が作成され、useReducer + localStorage 永続化実装
3. **UI**: 4象限ボード、タスクカード、モーダルが参照UIと同じデザインで実装
4. **機能**: CRUD + D&D + フィルターが動作
5. **永続化**: localStorage でデータ保持
6. **検証**: `npm run type-check && npm run build` 成功

---

**Last Updated**: 2025-12-07
**Author**: Claude Code + Human
