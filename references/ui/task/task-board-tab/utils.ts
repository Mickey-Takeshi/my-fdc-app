/**
 * app/_components/todo/task-board-tab/utils.ts
 *
 * ユーティリティ関数
 */

import type { DateSelection } from '@/lib/hooks/useTaskViewModel';
import { WEEKDAYS } from './constants';

// 日付オフセットを計算
export function getDateWithOffset(offset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}

// 日付を「11月29日（土）」形式でフォーマット
export function formatDateWithWeekday(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return `${month}月${day}日（${weekday}）`;
}

// DateSelectionから実際の日付を取得
export function getActualDate(selection: DateSelection): Date {
  switch (selection) {
    case 'yesterday': return getDateWithOffset(-1);
    case 'today': return getDateWithOffset(0);
    case 'tomorrow': return getDateWithOffset(1);
  }
}
