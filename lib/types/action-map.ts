/**
 * lib/types/action-map.ts
 *
 * Action Map / Action Item 型定義（Phase 10）
 * 3層アーキテクチャの戦術層
 */

/** ActionItem ステータス */
export type ActionItemStatus = 'not_started' | 'in_progress' | 'blocked' | 'done';

/** ActionItem 優先度 */
export type ActionItemPriority = 'low' | 'medium' | 'high';

/** ステータスラベル */
export const ACTION_ITEM_STATUS_LABELS: Record<ActionItemStatus, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  blocked: 'ブロック中',
  done: '完了',
};

/** 優先度ラベル */
export const ACTION_ITEM_PRIORITY_LABELS: Record<ActionItemPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

/** 全ステータス */
export const ALL_ACTION_ITEM_STATUSES: ActionItemStatus[] = [
  'not_started',
  'in_progress',
  'blocked',
  'done',
];

/** 全優先度 */
export const ALL_ACTION_ITEM_PRIORITIES: ActionItemPriority[] = ['low', 'medium', 'high'];

/** ActionMap（アプリ用） */
export interface ActionMap {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  targetPeriodStart: string | null;
  targetPeriodEnd: string | null;
  isArchived: boolean;
  keyResultId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  /** 計算値: ActionItem から算出 */
  progressRate?: number;
  /** 結合データ: ActionItems */
  items?: ActionItem[];
}

/** ActionItem（アプリ用） */
export interface ActionItem {
  id: string;
  actionMapId: string;
  workspaceId: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: ActionItemPriority;
  status: ActionItemStatus;
  parentItemId: string | null;
  sortOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  /** 計算値: 紐付きTaskから算出 */
  progressRate?: number;
  /** 紐付きTask数 */
  linkedTaskCount?: number;
  /** 完了Task数 */
  doneTaskCount?: number;
}

/** ActionMap DB行 */
export interface ActionMapRow {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  target_period_start: string | null;
  target_period_end: string | null;
  is_archived: boolean;
  key_result_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

/** ActionItem DB行 */
export interface ActionItemRow {
  id: string;
  action_map_id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  parent_item_id: string | null;
  sort_order: number;
  version: number;
  created_at: string;
  updated_at: string;
}

/** DB行 → ActionMap 変換 */
export function toActionMap(row: ActionMapRow): ActionMap {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description ?? '',
    targetPeriodStart: row.target_period_start,
    targetPeriodEnd: row.target_period_end,
    isArchived: row.is_archived,
    keyResultId: row.key_result_id,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** DB行 → ActionItem 変換 */
export function toActionItem(row: ActionItemRow): ActionItem {
  return {
    id: row.id,
    actionMapId: row.action_map_id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description ?? '',
    dueDate: row.due_date,
    priority: (row.priority as ActionItemPriority) || 'medium',
    status: (row.status as ActionItemStatus) || 'not_started',
    parentItemId: row.parent_item_id,
    sortOrder: row.sort_order,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
