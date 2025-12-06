/**
 * lib/types/todo.ts
 *
 * TODO機能のドメインモデル定義（再エクスポート）
 *
 * 分割されたファイル:
 * - task.ts: タスク、4象限、ステータス
 * - elastic-habit.ts: Elastic Habits、松竹梅、バッジ
 * - calendar.ts: カレンダー連携、日付ユーティリティ、ログ/サマリー
 */

// タスク関連
export type { Suit, TaskStatus, SubTask, Task } from './task';
export {
  SUIT_CONFIG,
  SUIT_ICONS,
  SUIT_EMOJI,
  createDefaultTask,
  calculateStreak,
  groupTasksBySuit,
  toCalendarTitle,
} from './task';

// Elastic Habits 関連
export type {
  ElasticLevel,
  ElasticLevelContent,
  ElasticHabit,
  UmeHabit,
  LinkedUmeHabit,
  HabitProgress,
  BadgeType,
  SuggestionConfidence,
  DurationSuggestion,
} from './elastic-habit';
export {
  ELASTIC_CONFIG,
  DEFAULT_HEART_HABITS,
  DEFAULT_CLUB_HABITS,
  createDefaultElasticHabit,
  updateElasticHabitStreak,
  createDefaultUmeHabit,
  updateUmeHabitStreak,
  BADGE_CONFIG,
  getTaskBadges,
} from './elastic-habit';

// カレンダー・日付・ログ関連
export type {
  TaskLog,
  DailySummary,
  MonthlySummary,
  WeeklyArchiveResult,
  MonthlyArchiveResult,
  ArchiveResult,
} from './calendar';
export {
  SUIT_TO_CALENDAR_COLOR,
  getCalendarColorId,
  CUTOFF_HOUR,
  getLogicalToday,
  getLogicalTodayString,
  formatDateJapanese,
  getISOWeekNumber,
  isSunday,
  isFirstDayOfMonth,
  getPreviousYearMonth,
  getDateBefore,
  createTaskLog,
  aggregateDailySummary,
  aggregateMonthlySummary,
  archiveWeeklyLogs,
  archiveMonthlyLogs,
  archiveOldLogs,
  shouldRunWeeklyArchive,
  shouldRunMonthlyArchive,
} from './calendar';
