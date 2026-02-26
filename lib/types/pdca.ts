/**
 * lib/types/pdca.ts
 *
 * Phase 8: PDCA分析用の型定義
 */

import { z } from 'zod';

// 期間タイプ
export const PeriodTypeSchema = z.enum(['weekly', 'monthly']);
export type PeriodType = z.infer<typeof PeriodTypeSchema>;

// 目標スキーマ
export const ApproachGoalSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  periodType: PeriodTypeSchema,
  periodStart: z.string(), // DATE型はstring
  periodEnd: z.string(),
  targetCount: z.number().int().min(0),
  targetSuccessRate: z.number().min(0).max(100).nullable(),
  improvementNote: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ApproachGoal = z.infer<typeof ApproachGoalSchema>;

// 作成入力
export const CreateApproachGoalInputSchema = z.object({
  periodType: PeriodTypeSchema,
  periodStart: z.string(),
  periodEnd: z.string(),
  targetCount: z.number().int().min(0),
  targetSuccessRate: z.number().min(0).max(100).optional(),
  improvementNote: z.string().optional(),
});

export type CreateApproachGoalInput = z.infer<typeof CreateApproachGoalInputSchema>;

// 更新入力
export const UpdateApproachGoalInputSchema = z.object({
  targetCount: z.number().int().min(0).optional(),
  targetSuccessRate: z.number().min(0).max(100).nullable().optional(),
  improvementNote: z.string().nullable().optional(),
});

export type UpdateApproachGoalInput = z.infer<typeof UpdateApproachGoalInputSchema>;

// PDCA分析結果
export interface PDCAAnalysis {
  // Plan: 目標
  goal: ApproachGoal | null;
  // Do: 実績
  actual: {
    count: number;
    successCount: number;
    successRate: number;
  };
  // Check: 達成率
  achievement: {
    countRate: number; // 目標件数に対する達成率
    successRateGap: number | null; // 目標成功率との差分
  };
  // 期間情報
  period: {
    type: PeriodType;
    start: string;
    end: string;
    label: string; // "2024年第50週" or "2024年12月"
  };
}

// 週次/月次の期間を計算するヘルパー
export function getCurrentWeekPeriod(): { start: string; end: string; label: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekNumber = getWeekNumber(now);

  return {
    start: formatDate(monday),
    end: formatDate(sunday),
    label: `${now.getFullYear()}年第${weekNumber}週`,
  };
}

export function getCurrentMonthPeriod(): { start: string; end: string; label: string } {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start: formatDate(firstDay),
    end: formatDate(lastDay),
    label: `${now.getFullYear()}年${now.getMonth() + 1}月`,
  };
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 期間ラベルを生成
export function getPeriodLabel(periodType: PeriodType, periodStart: string): string {
  const date = new Date(periodStart);
  if (periodType === 'weekly') {
    const weekNumber = getWeekNumber(date);
    return `${date.getFullYear()}年第${weekNumber}週`;
  } else {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  }
}
