/**
 * app/_components/todo/today-schedule/types.ts
 *
 * Phase 14.35: TodaySchedule 型定義
 */

import { Suit } from '@/lib/types/todo';

export interface CalendarEvent {
  id: string;
  calendarId: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  colorId?: string;
  isFdcTask: boolean;
  htmlLink?: string;
}

/** 予定のカテゴリ（6分類） */
export type EventCategory = Suit | 'joker' | 'unclassified';

/** カレンダーイベントからタスクを作成するためのデータ */
export interface EventToTaskData {
  title: string;
  description?: string;
  estimatedMinutes: number;
  startTime: string;
  endTime: string;
  calendarEventId: string;
  calendarId: string;
  /** 選択されたカテゴリ（スート/ジョーカー） */
  category: EventCategory;
}

/** 日付選択タイプ */
export type ScheduleDateSelection = 'yesterday' | 'today' | 'tomorrow';

export interface TodayScheduleProps {
  /** 選択されたカレンダーID一覧 */
  selectedCalendarIds?: string[];
  /** コンパクト表示モード */
  compact?: boolean;
  /** イベントをタスクに変換するコールバック */
  onCreateTaskFromEvent?: (data: EventToTaskData) => void;
  /** 外部から制御される日付選択（連動用） */
  externalSelectedDate?: ScheduleDateSelection;
}
