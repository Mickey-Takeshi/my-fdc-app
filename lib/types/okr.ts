/**
 * lib/types/okr.ts
 *
 * Phase 11: OKR（戦略層）型定義
 */

import { z } from 'zod';

// ========================================
// Objective（目標）
// ========================================

export interface Objective {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  period: string;  // 'Q1 2025', '2025年度' など
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  // 計算フィールド
  progress?: number;  // KRから計算
  keyResultCount?: number;
  completedKeyResultCount?: number;
}

export const CreateObjectiveInputSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  period: z.string().min(1, '期間は必須です'),
});

export type CreateObjectiveInput = z.infer<typeof CreateObjectiveInputSchema>;

export const UpdateObjectiveInputSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  period: z.string().min(1).optional(),
  isArchived: z.boolean().optional(),
});

export type UpdateObjectiveInput = z.infer<typeof UpdateObjectiveInputSchema>;

// ========================================
// Key Result（成果指標）
// ========================================

export interface KeyResult {
  id: string;
  objectiveId: string;
  workspaceId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;  // '%', '円', '件', '人' など
  createdAt: string;
  updatedAt: string;
  // 計算フィールド
  progress?: number;  // (currentValue / targetValue) × 100
  linkedActionMapCount?: number;
}

export const CreateKeyResultInputSchema = z.object({
  objectiveId: z.string().uuid(),
  title: z.string().min(1, 'タイトルは必須です'),
  targetValue: z.number().positive('目標値は正の数である必要があります'),
  currentValue: z.number().min(0).optional().default(0),
  unit: z.string().min(1, '単位は必須です'),
});

export type CreateKeyResultInput = z.infer<typeof CreateKeyResultInputSchema>;

export const UpdateKeyResultInputSchema = z.object({
  title: z.string().min(1).optional(),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().min(1).optional(),
});

export type UpdateKeyResultInput = z.infer<typeof UpdateKeyResultInputSchema>;

// ========================================
// 進捗計算ヘルパー
// ========================================

/**
 * Key Result の進捗率を計算
 */
export function calculateKeyResultProgress(
  currentValue: number,
  targetValue: number
): number {
  if (targetValue <= 0) return 0;
  const progress = (currentValue / targetValue) * 100;
  return Math.min(Math.round(progress), 100);  // 100%を上限
}

/**
 * Objective の進捗率を計算（子KRの平均）
 */
export function calculateObjectiveProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0;

  const totalProgress = keyResults.reduce((sum, kr) => {
    const krProgress = calculateKeyResultProgress(kr.currentValue, kr.targetValue);
    return sum + krProgress;
  }, 0);

  return Math.round(totalProgress / keyResults.length);
}

// ========================================
// 期間プリセット
// ========================================

export const PERIOD_PRESETS = [
  { value: 'Q1 2025', label: 'Q1 2025（1-3月）' },
  { value: 'Q2 2025', label: 'Q2 2025（4-6月）' },
  { value: 'Q3 2025', label: 'Q3 2025（7-9月）' },
  { value: 'Q4 2025', label: 'Q4 2025（10-12月）' },
  { value: '2025年度', label: '2025年度（通年）' },
];

export const UNIT_PRESETS = [
  { value: '%', label: '%' },
  { value: '円', label: '円' },
  { value: '万円', label: '万円' },
  { value: '件', label: '件' },
  { value: '人', label: '人' },
  { value: '社', label: '社' },
  { value: 'h', label: '時間' },
];
