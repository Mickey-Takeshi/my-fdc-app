/**
 * lib/types/task.ts
 *
 * Phase 9: Eisenhower Matrix対応
 * タスク関連の型定義
 * - 4象限（アイゼンハワーマトリクス）
 * - タスク本体
 * - サブタスク
 */

import { z } from 'zod';

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
export const SuitSchema = z.enum(['spade', 'heart', 'diamond', 'club']);
export type Suit = z.infer<typeof SuitSchema>;

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

export const TaskStatusSchema = z.enum(['not_started', 'in_progress', 'done']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '完了',
};

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * タスク本体
 */
export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  suit?: Suit;  // undefined = 分類待ち（ジョーカー）
  scheduledDate?: string;  // YYYY-MM-DD
  startAt?: string;        // "09:00" など
  durationMinutes?: number;
  dueDate?: string;
  priority?: number;
  subTasks?: SubTask[];
  status: TaskStatus;
  actionItemId?: string;  // Phase 10: ActionItem連携
  linkedActionItemIds?: string[];
  updatedAt: string;
  createdAt: string;
}

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
  actionItemId: z.string().uuid().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;

export const UpdateTaskInputSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: TaskStatusSchema.optional(),
  suit: SuitSchema.nullable().optional(),
  scheduledDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.number().int().min(0).max(3).nullable().optional(),
  actionItemId: z.string().uuid().nullable().optional(),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;

// ========================================
// フィルター
// ========================================

export type DateFilter = 'all' | 'yesterday' | 'today' | 'tomorrow';
export type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'done';
export type SuitFilter = 'all' | Suit | 'joker';

export interface TaskFilters {
  status: StatusFilter;
  suit: SuitFilter;
  date: DateFilter;
}

// ========================================
// ユーティリティ関数
// ========================================

export function createDefaultTask(partial: Partial<Task> = {}): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    workspaceId: '', // Will be set by API
    title: '',
    suit: 'heart',
    status: 'not_started',
    updatedAt: now,
    createdAt: now,
    ...partial,
  };
}

export function groupTasksBySuit(tasks: Task[]): {
  spade: Task[];
  heart: Task[];
  diamond: Task[];
  club: Task[];
  joker: Task[];
} {
  return {
    spade: tasks.filter(t => t.suit === 'spade'),
    heart: tasks.filter(t => t.suit === 'heart'),
    diamond: tasks.filter(t => t.suit === 'diamond'),
    club: tasks.filter(t => t.suit === 'club'),
    joker: tasks.filter(t => !t.suit),
  };
}

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  return {
    not_started: tasks.filter(t => t.status === 'not_started'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };
}

export function getActiveTasks(tasks: Task[]): Task[] {
  return tasks.filter(t => t.status !== 'done');
}

export function getTodayTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter(t => t.scheduledDate === today);
}

/**
 * 日付文字列をYYYY-MM-DD形式で取得
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * フィルター条件に基づいてタスクをフィルタリング
 */
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const today = new Date();
  const todayStr = formatDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateString(yesterday);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateString(tomorrow);

  return tasks.filter(task => {
    // ステータスフィルター
    if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }

    // 象限フィルター
    if (filters.suit !== 'all') {
      if (filters.suit === 'joker') {
        if (task.suit !== undefined) return false;
      } else {
        if (task.suit !== filters.suit) return false;
      }
    }

    // 日付フィルター
    if (filters.date !== 'all') {
      const taskDate = task.scheduledDate;
      switch (filters.date) {
        case 'yesterday':
          if (taskDate !== yesterdayStr) return false;
          break;
        case 'today':
          if (taskDate !== todayStr) return false;
          break;
        case 'tomorrow':
          if (taskDate !== tomorrowStr) return false;
          break;
      }
    }

    return true;
  });
}

/**
 * タスク統計を計算
 */
export interface TaskStats {
  total: number;
  completed: number;
  notStarted: number;
  inProgress: number;
  bySuit: Record<Suit, number>;
  jokerCount: number;
}

export function calculateTaskStats(tasks: Task[]): TaskStats {
  const stats: TaskStats = {
    total: tasks.length,
    completed: 0,
    notStarted: 0,
    inProgress: 0,
    bySuit: { spade: 0, heart: 0, diamond: 0, club: 0 },
    jokerCount: 0,
  };

  for (const task of tasks) {
    // ステータス別カウント
    if (task.status === 'done') stats.completed++;
    else if (task.status === 'in_progress') stats.inProgress++;
    else stats.notStarted++;

    // 象限別カウント
    if (task.suit) {
      stats.bySuit[task.suit]++;
    } else {
      stats.jokerCount++;
    }
  }

  return stats;
}
