/**
 * app/_components/todo/task-board-tab/constants.ts
 *
 * 定数定義
 */

import type { DateSelection } from '@/lib/hooks/useTaskViewModel';

// 日付ラベル
export const DATE_LABELS: Record<DateSelection, string> = {
  yesterday: '昨日',
  today: '今日',
  tomorrow: '明日',
};

// スートに対応する絵文字マッピング（カレンダー用）
export const SUIT_TO_EMOJI: Record<'spade' | 'heart' | 'diamond' | 'club', string> = {
  spade: '\u2B1B\uFE0F',   // ⬛️
  heart: '\uD83D\uDFE5',   // 🟥
  diamond: '\uD83D\uDFE8', // 🟨
  club: '\uD83D\uDFE6',    // 🟦
};

// 曜日の日本語表記
export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
