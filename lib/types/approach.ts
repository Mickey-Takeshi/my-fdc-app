/**
 * lib/types/approach.ts
 *
 * Phase 8: アプローチ（接触履歴）型定義
 */

import { z } from 'zod';

// ========================================
// アプローチタイプ
// ========================================

export const ApproachTypeSchema = z.enum([
  'call', // 電話
  'email', // メール
  'meeting', // ミーティング
  'visit', // 訪問
  'other', // その他
]);

export type ApproachType = z.infer<typeof ApproachTypeSchema>;

export const APPROACH_TYPE_LABELS: Record<ApproachType, string> = {
  call: '電話',
  email: 'メール',
  meeting: 'ミーティング',
  visit: '訪問',
  other: 'その他',
};

export const APPROACH_TYPE_COLORS: Record<ApproachType, string> = {
  call: '#4CAF50',
  email: '#2196F3',
  meeting: '#FF9800',
  visit: '#9C27B0',
  other: '#607D8B',
};

// ========================================
// アプローチ結果
// ========================================

export const ApproachResultSchema = z.enum([
  'success', // 成功（次のステップへ進んだ）
  'pending', // 保留（継続フォロー必要）
  'no_answer', // 不在・無応答
  'rejected', // 断られた
  'other', // その他
]);

export type ApproachResult = z.infer<typeof ApproachResultSchema>;

export const APPROACH_RESULT_LABELS: Record<ApproachResult, string> = {
  success: '成功',
  pending: '保留',
  no_answer: '不在',
  rejected: '断られた',
  other: 'その他',
};

export const APPROACH_RESULT_COLORS: Record<ApproachResult, string> = {
  success: '#4CAF50',
  pending: '#FF9800',
  no_answer: '#9E9E9E',
  rejected: '#F44336',
  other: '#607D8B',
};

// ========================================
// Approach（アプローチ）型
// ========================================

export const ApproachSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  leadId: z.string().uuid(),
  userId: z.string().uuid(),
  type: ApproachTypeSchema,
  content: z.string().min(1, '内容は必須です'),
  result: ApproachResultSchema.optional(),
  resultNote: z.string().optional(),
  approachedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Approach = z.infer<typeof ApproachSchema>;

// ========================================
// 作成・更新用スキーマ
// ========================================

export const CreateApproachSchema = z.object({
  leadId: z.string().uuid(),
  type: ApproachTypeSchema,
  content: z.string().min(1, '内容は必須です'),
  result: ApproachResultSchema.optional(),
  resultNote: z.string().optional(),
  approachedAt: z.string().optional(), // 省略時は現在時刻
});

export type CreateApproachInput = z.infer<typeof CreateApproachSchema>;

export const UpdateApproachSchema = z.object({
  id: z.string().uuid(),
  type: ApproachTypeSchema.optional(),
  content: z.string().optional(),
  result: ApproachResultSchema.optional(),
  resultNote: z.string().optional(),
  approachedAt: z.string().optional(),
});

export type UpdateApproachInput = z.infer<typeof UpdateApproachSchema>;

// ========================================
// 統計用型
// ========================================

export interface ApproachStats {
  total: number;
  thisWeek: number;
  thisMonth: number;
  byType: Record<ApproachType, number>;
  byResult: Record<ApproachResult, number>;
  successRate: number; // 成功率 (%)
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * 今週のアプローチかどうか
 */
export function isThisWeek(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart;
}

/**
 * 今月のアプローチかどうか
 */
export function isThisMonth(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  );
}

/**
 * アプローチ統計を計算
 */
export function calculateApproachStats(approaches: Approach[]): ApproachStats {
  const byType: Record<ApproachType, number> = {
    call: 0,
    email: 0,
    meeting: 0,
    visit: 0,
    other: 0,
  };

  const byResult: Record<ApproachResult, number> = {
    success: 0,
    pending: 0,
    no_answer: 0,
    rejected: 0,
    other: 0,
  };

  let thisWeek = 0;
  let thisMonth = 0;

  approaches.forEach((a) => {
    byType[a.type] = (byType[a.type] || 0) + 1;
    if (a.result) {
      byResult[a.result] = (byResult[a.result] || 0) + 1;
    }
    if (isThisWeek(a.approachedAt)) thisWeek++;
    if (isThisMonth(a.approachedAt)) thisMonth++;
  });

  const withResult = approaches.filter((a) => a.result).length;
  const successRate =
    withResult > 0 ? Math.round((byResult.success / withResult) * 100) : 0;

  return {
    total: approaches.length,
    thisWeek,
    thisMonth,
    byType,
    byResult,
    successRate,
  };
}
