/**
 * lib/types/elastic-habit.ts
 *
 * Elastic Habits（松竹梅）関連の型定義
 * - 梅・竹・松レベル
 * - 習慣マスタ
 * - ストリーク・バッジ
 */

import type { Task } from './task';

// ========================================
// Elastic Habits（松竹梅）
// ========================================

/**
 * Elastic Habits のレベル定義（松竹梅）
 * - ume: 梅（最小）- やる気がない日でも達成可能
 * - take: 竹（標準）- 通常の目標レベル
 * - matsu: 松（最大）- やる気がある日のチャレンジ
 */
export type ElasticLevel = 'ume' | 'take' | 'matsu';

/**
 * Elastic Habits レベル設定
 *
 * Google Calendar連携: 15分が最小単位
 * - 梅: 5分 × 3回 = 15分ブロック（やる気ない日でも5分だけ）
 * - 竹: 15分 = 1ブロック
 * - 松: 30分 = 2ブロック
 */
export const ELASTIC_CONFIG: Record<ElasticLevel, {
  ja: string;
  en: string;
  defaultMinutes: number;
  reps: number;              // 回数（梅は3回で15分ブロック）
  calendarBlocks: number;    // Google Calendar 15分ブロック数
  description: string;
}> = {
  ume: {
    ja: '梅（最小）',
    en: 'Minimum',
    defaultMinutes: 5,
    reps: 3,
    calendarBlocks: 1,
    description: '5分未満×3回で15分。やる気がない日でもOK',
  },
  take: {
    ja: '竹（標準）',
    en: 'Standard',
    defaultMinutes: 15,
    reps: 1,
    calendarBlocks: 1,
    description: '通常の目標レベル。15分しっかり取り組む',
  },
  matsu: {
    ja: '松（最大）',
    en: 'Maximum',
    defaultMinutes: 30,
    reps: 1,
    calendarBlocks: 2,
    description: 'やる気がある日のチャレンジ。30分集中',
  },
};

// ========================================
// Elastic Habit（編集可能な習慣マスタ）
// ========================================

/**
 * 松竹梅レベル別の具体内容
 */
export interface ElasticLevelContent {
  label: string;              // "本を1ページ読む", "30分ランニング" など
  durationMinutes: number;    // 梅: 5, 竹: 15, 松: 30
}

/**
 * Elastic Habit（編集可能な習慣）
 * - ♥ ハート: 重要なこと（読書・運動・瞑想）
 * - ♣ クラブ: 20%タイム（趣味・興味・チャレンジ）
 */
export interface ElasticHabit {
  id: string;
  title: string;              // "読書", "運動" など
  description?: string;
  suit: 'heart' | 'club';     // ♥ or ♣ のみ

  // 松竹梅それぞれの具体内容
  levels: {
    ume: ElasticLevelContent;   // 梅: 5分
    take: ElasticLevelContent;  // 竹: 15分
    matsu: ElasticLevelContent; // 松: 30分
  };

  // ストリーク
  streakCount: number;
  longestStreak: number;
  lastCompletedAt?: string;   // ISO 8601

  // メタデータ
  createdAt: number;
  updatedAt: number;
}

/**
 * デフォルトの Elastic Habit 一覧（♥ハート）
 */
export const DEFAULT_HEART_HABITS: Omit<ElasticHabit, 'id' | 'createdAt' | 'updatedAt' | 'streakCount' | 'longestStreak'>[] = [
  {
    title: 'ごきげんでいる',
    description: '自分のごきげんは自分でとる習慣',
    suit: 'heart',
    levels: {
      ume: { label: '鏡を見て笑顔をつくる', durationMinutes: 5 },
      take: { label: 'お気に入りの飲み物でひと息つく', durationMinutes: 15 },
      matsu: { label: '自分へのご褒美タイムを楽しむ', durationMinutes: 30 },
    },
  },
  {
    title: '運動',
    description: '身体を動かして健康維持',
    suit: 'heart',
    levels: {
      ume: { label: 'ストレッチ', durationMinutes: 5 },
      take: { label: '軽いエクササイズ', durationMinutes: 15 },
      matsu: { label: 'しっかり運動', durationMinutes: 30 },
    },
  },
  {
    title: '瞑想',
    description: '心を整える時間',
    suit: 'heart',
    levels: {
      ume: { label: '深呼吸3回', durationMinutes: 5 },
      take: { label: 'マインドフルネス', durationMinutes: 15 },
      matsu: { label: '本格瞑想', durationMinutes: 30 },
    },
  },
];

/**
 * デフォルトの Elastic Habit 一覧（♣クラブ / 20%タイム）
 */
export const DEFAULT_CLUB_HABITS: Omit<ElasticHabit, 'id' | 'createdAt' | 'updatedAt' | 'streakCount' | 'longestStreak'>[] = [
  {
    title: '趣味',
    description: '好きなことに没頭する時間',
    suit: 'club',
    levels: {
      ume: { label: '少しだけ触れる', durationMinutes: 5 },
      take: { label: '楽しむ時間', durationMinutes: 15 },
      matsu: { label: 'じっくり没頭', durationMinutes: 30 },
    },
  },
  {
    title: '興味',
    description: '気になることを調べる',
    suit: 'club',
    levels: {
      ume: { label: 'ちょっと検索', durationMinutes: 5 },
      take: { label: '調べものタイム', durationMinutes: 15 },
      matsu: { label: '深掘りリサーチ', durationMinutes: 30 },
    },
  },
  {
    title: 'チャレンジ',
    description: '新しいことに挑戦する',
    suit: 'club',
    levels: {
      ume: { label: '1つ試す', durationMinutes: 5 },
      take: { label: '新しい挑戦', durationMinutes: 15 },
      matsu: { label: '本気でトライ', durationMinutes: 30 },
    },
  },
];

/**
 * デフォルトの Elastic Habit を生成
 */
export function createDefaultElasticHabit(
  partial: Partial<ElasticHabit> & Pick<ElasticHabit, 'title' | 'suit' | 'levels'>
): ElasticHabit {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    streakCount: 0,
    longestStreak: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/**
 * Elastic Habit のストリークを更新
 */
export function updateElasticHabitStreak(habit: ElasticHabit, today: Date = new Date()): ElasticHabit {
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const lastDate = habit.lastCompletedAt?.split('T')[0];

  let newStreakCount = habit.streakCount;

  if (lastDate === todayStr) {
    return habit;
  } else if (lastDate === yesterdayStr) {
    newStreakCount = habit.streakCount + 1;
  } else {
    newStreakCount = 1;
  }

  return {
    ...habit,
    streakCount: newStreakCount,
    longestStreak: Math.max(habit.longestStreak, newStreakCount),
    lastCompletedAt: today.toISOString(),
    updatedAt: Date.now(),
  };
}

// ========================================
// 梅習慣（UmeHabit）マスタ - 後方互換
// ========================================

/**
 * 梅習慣（5分単位のマスタ）- 後方互換のため維持
 * @deprecated ElasticHabit を使用してください
 */
export interface UmeHabit {
  id: string;
  title: string;
  description?: string;
  suit: 'heart' | 'club';
  durationMinutes: 5;

  streakCount: number;
  longestStreak: number;
  lastCompletedAt?: string;

  createdAt: number;
  updatedAt: number;
}

/**
 * 15分タスクに紐付けた梅習慣
 */
export interface LinkedUmeHabit {
  habitId: string;            // UmeHabit.id
  title: string;              // スナップショット（習慣名）
  completed: boolean;
  completedAt?: string;       // ISO 8601
}

/**
 * デフォルトの梅習慣マスタを生成
 */
export function createDefaultUmeHabit(partial: Partial<UmeHabit> = {}): UmeHabit {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: '',
    suit: 'heart',
    durationMinutes: 5,
    streakCount: 0,
    longestStreak: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/**
 * 梅習慣のストリークを更新
 */
export function updateUmeHabitStreak(habit: UmeHabit, today: Date = new Date()): UmeHabit {
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // 最後の完了日を取得
  const lastDate = habit.lastCompletedAt?.split('T')[0];

  let newStreakCount = habit.streakCount;

  if (lastDate === todayStr) {
    // 今日既に完了済み → ストリーク変更なし
    return habit;
  } else if (lastDate === yesterdayStr) {
    // 昨日完了 → ストリーク継続
    newStreakCount = habit.streakCount + 1;
  } else {
    // 2日以上空き → リセットして1から
    newStreakCount = 1;
  }

  return {
    ...habit,
    streakCount: newStreakCount,
    longestStreak: Math.max(habit.longestStreak, newStreakCount),
    lastCompletedAt: today.toISOString(),
    updatedAt: Date.now(),
  };
}

// ========================================
// 習慣進捗（UX強化）
// ========================================

/**
 * Elastic Habits の達成状態
 */
export interface HabitProgress {
  habitId: string;
  title: string;
  streakCount: number;           // 連続達成日数
  longestStreak: number;         // 過去最長ストリーク
  totalCompletions: number;      // 累計達成回数
  weeklyCompletions: number[];   // 直近7日の達成（0/1配列）
  monthlyCompletions: number[];  // 直近30日の達成
}

/**
 * バッジタイプ
 */
export type BadgeType = 'streak_7' | 'streak_30' | 'streak_100' | 'longest_streak';

/**
 * バッジ設定
 */
export const BADGE_CONFIG: Record<BadgeType, {
  emoji: string;
  label: string;
  description: string;
}> = {
  streak_7: {
    emoji: '🔥',
    label: '7日連続',
    description: '7日連続達成',
  },
  streak_30: {
    emoji: '🌟',
    label: '30日連続',
    description: '30日連続達成',
  },
  streak_100: {
    emoji: '👑',
    label: '100日連続',
    description: '100日連続達成',
  },
  longest_streak: {
    emoji: '💎',
    label: '記録更新',
    description: '過去最長ストリーク更新',
  },
};

/**
 * タスクのバッジを取得
 * @param task - タスク
 * @param longestStreak - 過去最長ストリーク（比較用）
 * @returns 獲得したバッジの配列
 */
export function getTaskBadges(task: Task, longestStreak: number = 0): BadgeType[] {
  const badges: BadgeType[] = [];
  const streak = task.streakCount ?? 0;

  if (streak >= 100) badges.push('streak_100');
  else if (streak >= 30) badges.push('streak_30');
  else if (streak >= 7) badges.push('streak_7');

  if (streak > longestStreak && streak > 0) {
    badges.push('longest_streak');
  }

  return badges;
}

// ========================================
// 推奨時間サジェスト
// ========================================

/**
 * 推奨時間の信頼度
 */
export type SuggestionConfidence = 'high' | 'medium' | 'low';

/**
 * 推奨時間サジェスト結果
 */
export interface DurationSuggestion {
  suggestedMinutes: number;
  confidence: SuggestionConfidence;
  reason: string; // "過去の同カテゴリ平均", "タイトルから推定" など
}
