/**
 * lib/types/time-allocation.ts
 *
 * Phase 10-D-2: 時間有効活用ダッシュボード用の型定義
 *
 * 【コンセプト】
 * - 1日の活動可能時間を5つに分類（4象限 + Joker）
 * - 「ジョーカー時間」を減らすほど有効活用度が上がる
 */

import type { Suit } from './todo';

// ========================================
// ユーザー設定
// ========================================

export interface TimeSettings {
  sleepHours: number;           // 平均睡眠時間（デフォルト: 7h）
  targetEffectiveness: number;  // 目標有効活用率（デフォルト: 70%）
}

export const DEFAULT_TIME_SETTINGS: TimeSettings = {
  sleepHours: 7,
  targetEffectiveness: 70,
};

// ========================================
// 時間配分データ
// ========================================

export type TimePeriod = 'daily' | 'weekly' | 'monthly';

export interface TimeAllocation {
  date: string;                // "2025-11-28" or "2025-W48" or "2025-11"
  period: TimePeriod;

  availableMinutes: number;    // 活動可能時間（分）

  // 4象限 + ジョーカー（分単位）
  spadeMinutes: number;        // ♠ 緊急かつ重要
  heartMinutes: number;        // ♥ 重要なこと
  diamondMinutes: number;      // ♦ 緊急なだけ
  clubMinutes: number;         // ♣ 未来創造
  jokerMinutes: number;        // 🃏 未分類/空き時間

  // 計算値
  allocatedMinutes: number;    // 4象限の合計
  effectivenessRate: number;   // 有効活用率 = allocated / available * 100
}

// ========================================
// Google Calendar colorId マッピング
// ========================================

export const CALENDAR_COLOR_TO_SUIT: Record<string, Suit | 'joker'> = {
  '8': 'spade',     // Graphite（黒系）
  '11': 'heart',    // Tomato（赤）
  '5': 'diamond',   // Banana（黄）
  '9': 'club',      // Blueberry（青）
};

export function getCalendarEventSuit(colorId: string | undefined, title?: string): Suit | 'joker' {
  // 1. タイトルプレフィックスで判定
  if (title) {
    if (title.startsWith('[♠]')) return 'spade';
    if (title.startsWith('[♥]')) return 'heart';
    if (title.startsWith('[♦]')) return 'diamond';
    if (title.startsWith('[♣]')) return 'club';
  }

  // 2. colorId で判定
  if (colorId && CALENDAR_COLOR_TO_SUIT[colorId]) {
    return CALENDAR_COLOR_TO_SUIT[colorId];
  }

  // 3. 判定できない → ジョーカー
  return 'joker';
}

// ========================================
// 時間配分の計算
// ========================================

export interface TaskMinutesBySuit {
  spade: number;
  heart: number;
  diamond: number;
  club: number;
  joker: number;
}

/**
 * タスクリストから各スートの時間を集計
 */
export function calculateTaskMinutesBySuit(
  tasks: Array<{ suit?: Suit; durationMinutes?: number; status?: string }>
): TaskMinutesBySuit {
  const result: TaskMinutesBySuit = {
    spade: 0,
    heart: 0,
    diamond: 0,
    club: 0,
    joker: 0,
  };

  for (const task of tasks) {
    const minutes = task.durationMinutes || 0;
    if (!task.suit || !['spade', 'heart', 'diamond', 'club'].includes(task.suit)) {
      result.joker += minutes;
    } else {
      result[task.suit] += minutes;
    }
  }

  return result;
}

/**
 * 1日の時間配分を計算
 */
export function calculateDailyTimeAllocation(
  date: string,
  taskMinutes: TaskMinutesBySuit,
  settings: TimeSettings = DEFAULT_TIME_SETTINGS
): TimeAllocation {
  const availableMinutes = (24 - settings.sleepHours) * 60;

  const spadeMinutes = taskMinutes.spade;
  const heartMinutes = taskMinutes.heart;
  const diamondMinutes = taskMinutes.diamond;
  const clubMinutes = taskMinutes.club;

  const allocatedMinutes = spadeMinutes + heartMinutes + diamondMinutes + clubMinutes;
  const jokerMinutes = Math.max(0, availableMinutes - allocatedMinutes - taskMinutes.joker);

  const effectivenessRate = availableMinutes > 0
    ? Math.round((allocatedMinutes / availableMinutes) * 1000) / 10
    : 0;

  return {
    date,
    period: 'daily',
    availableMinutes,
    spadeMinutes,
    heartMinutes,
    diamondMinutes,
    clubMinutes,
    jokerMinutes: jokerMinutes + taskMinutes.joker, // 未分類タスク + 空き時間
    allocatedMinutes,
    effectivenessRate,
  };
}

// ========================================
// 表示用ヘルパー
// ========================================

export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins}分`;
}

export function getEffectivenessStatus(
  rate: number,
  target: number
): { label: string; color: string } {
  if (rate >= target) {
    return { label: '目標達成！', color: '#4CAF50' };
  }
  if (rate >= target * 0.8) {
    return { label: 'あと少し', color: '#FF9800' };
  }
  return { label: '頑張ろう', color: '#9E9E9E' };
}
