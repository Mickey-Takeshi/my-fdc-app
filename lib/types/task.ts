/**
 * lib/types/task.ts
 *
 * タスクの型定義（Phase 1 → Phase 9 拡張）
 * アイゼンハワーマトリクス（4象限）対応
 */

/** スート（4象限） */
export type Suit = 'spade' | 'heart' | 'diamond' | 'club';

/** タスクステータス */
export type TaskStatus = 'not_started' | 'in_progress' | 'done';

/** スートラベル */
export const SUIT_LABELS: Record<Suit, string> = {
  spade: 'Spade',
  heart: 'Heart',
  diamond: 'Diamond',
  club: 'Club',
};

/** スートシンボル */
export const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: '\u2660',
  heart: '\u2665',
  diamond: '\u2666',
  club: '\u2663',
};

/** スート説明 */
export const SUIT_DESCRIPTIONS: Record<Suit, string> = {
  spade: '緊急かつ重要',
  heart: '重要だが緊急でない',
  diamond: '緊急だが重要でない',
  club: '緊急でも重要でもない',
};

/** 全スート */
export const ALL_SUITS: Suit[] = ['spade', 'heart', 'diamond', 'club'];

/** ステータスラベル */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '完了',
};

/** 全ステータス */
export const ALL_TASK_STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'done'];

/** タスク（アプリ用） */
export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  suit: Suit | null;
  scheduledDate: string | null;
  dueDate: string | null;
  priority: number;
  actionItemId: string | null;
  linkedActionItemIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** タスクDB行 */
export interface TaskRow {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: string;
  suit: string | null;
  scheduled_date: string | null;
  due_date: string | null;
  priority: number;
  action_item_id: string | null;
  linked_action_item_ids: string[] | null;
  google_task_id: string | null;
  google_task_list_id: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

/** DB行 → アプリ型変換 */
export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description ?? '',
    status: (row.status as TaskStatus) || 'not_started',
    suit: (row.suit as Suit) || null,
    scheduledDate: row.scheduled_date,
    dueDate: row.due_date,
    priority: row.priority ?? 0,
    actionItemId: row.action_item_id,
    linkedActionItemIds: row.linked_action_item_ids ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
