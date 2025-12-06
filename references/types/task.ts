/**
 * lib/types/task.ts
 *
 * タスク関連の型定義
 * - 4象限（アイゼンハワーマトリクス）
 * - タスク本体
 * - サブタスク
 */

import type { ElasticLevel, LinkedUmeHabit } from './elastic-habit';

// ========================================
// 4象限（アイゼンハワーマトリクス）
// ========================================

/**
 * 4象限のスート定義
 * - spade: 緊急かつ重要（Do First）→ 黒
 * - heart: 重要なこと（Schedule）→ 赤（Elastic Habits 対象）
 * - diamond: 緊急なだけ（Delegate）→ 黄
 * - club: 未来創造（Create Future）→ 青
 */
export type Suit = 'spade' | 'heart' | 'diamond' | 'club';

/**
 * スート設定（UI表示用）
 *
 * ♠ スペード: 緊急かつ重要 → すぐやる（黒）
 * ♥ ハート: 重要 → 予定に入れ実行（赤）
 * ♦ ダイヤ: 緊急なだけ → 任せる＆自動化（黄）
 * ♣ クラブ: 未来創造20%タイム → そのまま（青）
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
    color: '#000000',  // 純粋な黒
    symbol: '♠',
  },
  heart: {
    ja: '予定に入れ実行',
    en: 'Schedule',
    color: '#DC143C',  // 🟥 鮮やかな赤（クリムゾン）
    symbol: '♥',
  },
  diamond: {
    ja: '任せる＆自動化',
    en: 'Delegate',
    color: '#FFC107',  // 🟨 黄色（アンバー）
    symbol: '♦',
  },
  club: {
    ja: '未来創造20%タイム',
    en: 'Create Future',
    color: '#1976D2',  // 青
    symbol: '♣',
  },
};

/**
 * スートSVGアイコン（React用）
 */
export const SUIT_ICONS: Record<Suit, string> = {
  spade: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.5 5.5 5 9 5 13c0 2.2 1.8 4 4 4 .7 0 1.4-.2 2-.5V20H9v2h6v-2h-2v-3.5c.6.3 1.3.5 2 .5 2.2 0 4-1.8 4-4 0-4-4.5-7.5-7-11z"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  diamond: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>`,
  club: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-1.7 0-3 1.3-3 3 0 .8.3 1.5.8 2.1-.5-.1-1-.1-1.3-.1C6 7 4 9 4 11.5S6 16 8.5 16c.8 0 1.5-.2 2.1-.5-.1.5-.1.9-.1 1.5v3H9v2h6v-2h-1.5v-3c0-.6 0-1-.1-1.5.6.3 1.3.5 2.1.5 2.5 0 4.5-2 4.5-4.5S18 7 15.5 7c-.3 0-.8 0-1.3.1.5-.6.8-1.3.8-2.1 0-1.7-1.3-3-3-3z"/></svg>`,
};

// ========================================
// タスク
// ========================================

/**
 * タスクのステータス
 */
export type TaskStatus = 'not_started' | 'in_progress' | 'done';

/**
 * サブタスク
 */
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * タスク本体（Phase 10 正式版）
 * 【Phase 13】suit を Optional に変更（undefined = 分類待ち/ジョーカー）
 * 【Phase 13.5】マルチユーザー対応: assigneeId を追加
 * 【Phase 14.9】scheduledDate を追加（タスクの予定日）
 */
export interface Task {
  id: string;
  title: string;
  description?: string;

  // 4象限（undefined = 分類待ち/ジョーカー）
  suit?: Suit;

  // 予定日（YYYY-MM-DD形式、例: "2025-12-03"）
  // 日付選択（yesterday/today/tomorrow）でのフィルタに使用
  scheduledDate?: string;

  // 時間ブロック（15分刻み）
  startAt?: string;           // "09:00", "14:15" など
  durationMinutes?: number;   // 15の倍数推奨
  suggestedDuration?: number; // AI/過去実績からの推奨時間

  // Elastic Habits
  isElasticHabit?: boolean;
  elasticLevel?: ElasticLevel;
  streakCount?: number;       // 連続達成日数
  lastCompletedAt?: string;   // 最終完了日（ストリーク計算用）

  // 連携
  googleCalendarEventId?: string;
  googleTaskId?: string;           // Google Tasks同期用

  // サブタスク
  subTasks?: SubTask[];

  // 梅習慣の紐付け（最大3つ = 15分）
  linkedUmeHabits?: LinkedUmeHabit[];

  // マルチユーザー対応（Phase 13.5）
  assigneeId?: string;        // 担当者のユーザーID（未設定の場合は作成者のタスク）

  // ステータス・メタデータ
  status: TaskStatus;
  updatedAt: number;
  createdAt: number;
}

// ========================================
// ユーティリティ関数
// ========================================

/**
 * タスクのデフォルト値を生成
 */
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

/**
 * ストリーク（連続達成日数）を計算
 * @param task - タスク
 * @param today - 今日の日付（テスト用に指定可能）
 * @returns 連続達成日数
 */
export function calculateStreak(task: Task, today: Date = new Date()): number {
  if (!task.lastCompletedAt) return 0;

  const lastCompleted = new Date(task.lastCompletedAt);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastStart = new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate());

  const diffDays = Math.floor(
    (todayStart.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 昨日または今日完了していればストリーク継続
  if (diffDays <= 1) {
    return task.streakCount ?? 0;
  }

  // 2日以上空いていればリセット
  return 0;
}

/**
 * スート別にタスクをグループ化
 * @param tasks - タスク配列
 * @returns スート別タスク
 */
export function groupTasksBySuit(tasks: Task[]): Record<Suit, Task[]> {
  return {
    spade: tasks.filter(t => t.suit === 'spade'),
    heart: tasks.filter(t => t.suit === 'heart'),
    diamond: tasks.filter(t => t.suit === 'diamond'),
    club: tasks.filter(t => t.suit === 'club'),
  };
}

/**
 * スート絵文字マッピング（Googleカレンダー/タスク用）
 * - spade（黒）→ ⬛
 * - heart（赤）→ 🟥
 * - diamond（黄）→ 🟨
 * - club（青）→ 🟦
 */
export const SUIT_EMOJI: Record<Suit, string> = {
  spade: '⬛',
  heart: '🟥',
  diamond: '🟨',
  club: '🟦',
};

/**
 * タスクをGoogleカレンダーイベントタイトルに変換
 * @param task - タスク
 * @returns カレンダーイベントタイトル（例: ⬛松本さん、🟥運動）
 */
export function toCalendarTitle(task: Task): string {
  // suitが未設定（ジョーカー）の場合は🃏を使用
  const emoji = task.suit ? SUIT_EMOJI[task.suit] : '🃏';
  return `${emoji}${task.title}`;
}
