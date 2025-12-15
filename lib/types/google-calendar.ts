/**
 * lib/types/google-calendar.ts
 *
 * Phase 13: Google Calendar API の型定義
 */

/**
 * カレンダー情報
 */
export interface GoogleCalendar {
  id: string;
  summary: string;  // カレンダー名
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
}

/**
 * カレンダー一覧レスポンス
 */
export interface GoogleCalendarListResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleCalendar[];
}

/**
 * イベントの日時情報
 */
export interface GoogleEventDateTime {
  dateTime?: string;  // RFC3339 形式（時刻あり）
  date?: string;      // 終日イベントの場合（YYYY-MM-DD）
  timeZone?: string;
}

/**
 * Google Calendar イベント
 */
export interface GoogleEvent {
  id: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
  summary?: string;  // イベント名
  description?: string;
  location?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  recurrence?: string[];
  recurringEventId?: string;
  organizer?: {
    email?: string;
    displayName?: string;
    self?: boolean;
  };
  creator?: {
    email?: string;
    displayName?: string;
  };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  colorId?: string;
}

/**
 * イベント一覧レスポンス
 */
export interface GoogleEventsListResponse {
  kind: string;
  etag: string;
  summary: string;
  updated: string;
  timeZone: string;
  accessRole: string;
  nextPageToken?: string;
  nextSyncToken?: string;
  items: GoogleEvent[];
}

/**
 * アプリ内で使用するイベント情報（正規化済み）
 */
export interface CalendarEvent {
  id: string;
  googleEventId: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  htmlLink?: string;
  // FDC 分類用
  suit?: 'spade' | 'heart' | 'diamond' | 'club' | 'joker' | 'unclassified';
}

/**
 * Suit（4象限 + 2特殊）の定義
 */
export type Suit = 'spade' | 'heart' | 'diamond' | 'club' | 'joker' | 'unclassified';

export const SUIT_INFO: Record<Suit, { label: string; emoji: string; color: string; description: string }> = {
  spade: {
    label: 'すぐやる',
    emoji: '♠',
    color: '#1a1a1a',
    description: '緊急 × 重要：今すぐ実行',
  },
  heart: {
    label: '予定に入れ実行',
    emoji: '♥',
    color: '#dc2626',
    description: '緊急でない × 重要：計画的に実行',
  },
  diamond: {
    label: '任せる・自動化',
    emoji: '♦',
    color: '#f59e0b',
    description: '緊急 × 重要でない：委任・効率化',
  },
  club: {
    label: '未来創造20%',
    emoji: '♣',
    color: '#2563eb',
    description: '緊急でない × 重要でない：創造的活動',
  },
  joker: {
    label: '分類待ち',
    emoji: '🃏',
    color: '#8b5cf6',
    description: '特殊タスク・要分類',
  },
  unclassified: {
    label: '未分類',
    emoji: '❓',
    color: '#6b7280',
    description: 'カレンダーから取得、要分類',
  },
};
