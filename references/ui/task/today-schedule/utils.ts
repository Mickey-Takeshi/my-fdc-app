/**
 * app/_components/todo/today-schedule/utils.ts
 *
 * Phase 14.35: TodaySchedule ユーティリティ関数
 */

import { SUIT_CONFIG, type Suit } from '@/lib/types/todo';
import { CalendarEvent, EventCategory, ScheduleDateSelection } from './types';

/**
 * 時刻を HH:MM 形式にフォーマット
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * 分単位の所要時間を計算
 */
export function getDurationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

/**
 * タイトルからスートを推定（従来のトランプ記号 + 絵文字プレフィックス）
 */
export function detectSuitFromTitle(title: string): Suit | null {
  // 従来のトランプ記号
  if (title.includes('[♠]')) return 'spade';
  if (title.includes('[♥]')) return 'heart';
  if (title.includes('[♦]')) return 'diamond';
  if (title.includes('[♣]')) return 'club';

  // 絵文字プレフィックス（⬛️🟥🟨🟦）
  if (title.startsWith('⬛️') || title.startsWith('⬛')) return 'spade';
  if (title.startsWith('🟥')) return 'heart';
  if (title.startsWith('🟨')) return 'diamond';
  if (title.startsWith('🟦')) return 'club';

  return null;
}

/**
 * Google Calendar colorId からスートを推定
 */
export function detectSuitFromColorId(colorId?: string): Suit | null {
  switch (colorId) {
    case '8':
      return 'spade'; // Graphite
    case '11':
      return 'heart'; // Tomato
    case '5':
      return 'diamond'; // Banana
    case '7':
      return 'club'; // Peacock
    default:
      return null;
  }
}

/**
 * イベントが「未分類」かどうかを判定
 */
export function isUnclassifiedEvent(event: CalendarEvent): boolean {
  const duration = getDurationMinutes(event.start, event.end);
  // 24時間以上（2日にまたがる予定）
  if (duration >= 24 * 60) return true;
  // 5分以下の予定（メモ的）
  if (duration <= 5) return true;
  return false;
}

/**
 * カテゴリ設定
 */
export const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; bg: string; symbol?: string }> = {
  spade: { label: '緊急×重要', color: SUIT_CONFIG.spade.color, bg: '#ECEFF1', symbol: '♠' },
  heart: { label: '重要', color: SUIT_CONFIG.heart.color, bg: '#FFEBEE', symbol: '♥' },
  diamond: { label: '緊急', color: SUIT_CONFIG.diamond.color, bg: '#FFF8E1', symbol: '♦' },
  club: { label: '未来創造20%タイム', color: SUIT_CONFIG.club.color, bg: '#E3F2FD', symbol: '♣' },
  joker: { label: 'ジョーカー', color: '#9C27B0', bg: '#F3E5F5', symbol: '☆' },
  unclassified: { label: '未分類', color: '#757575', bg: '#FAFAFA' },
};

// 曜日の日本語表記
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * 日付ラベルを取得
 */
export function getDateLabel(date: ScheduleDateSelection): string {
  switch (date) {
    case 'yesterday': return '昨日';
    case 'today': return '今日';
    case 'tomorrow': return '明日';
  }
}

/**
 * 日付オフセットを計算
 */
export function getDateOffset(date: ScheduleDateSelection): number {
  switch (date) {
    case 'yesterday': return -1;
    case 'today': return 0;
    case 'tomorrow': return 1;
  }
}

/**
 * オフセットを適用した日付を取得
 */
export function getDateWithOffset(offset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}

/**
 * 選択中の日付を取得
 */
export function getActualDate(selection: ScheduleDateSelection): Date {
  switch (selection) {
    case 'yesterday': return getDateWithOffset(-1);
    case 'today': return getDateWithOffset(0);
    case 'tomorrow': return getDateWithOffset(1);
  }
}

/**
 * 日付を「11月29日（土）」形式でフォーマット
 */
export function formatDateWithWeekday(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return `${month}月${day}日（${weekday}）`;
}
