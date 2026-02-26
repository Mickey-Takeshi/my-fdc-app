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
  keyResultId?: string;  // Phase 11: OKR連携
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
  version: z.number().optional(),
  keyResultId: z.string().uuid().nullable().optional(),  // Phase 11: OKR連携
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
