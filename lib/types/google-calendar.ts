/**
 * lib/types/google-calendar.ts
 *
 * Google Calendar 連携用型定義（Phase 13）
 */

/** Google Calendar（API レスポンス） */
export interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

/** Google Calendar Event（API レスポンス） */
export interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  htmlLink?: string;
  status?: string;
}

/** アプリ内で使うカレンダーイベント */
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  location: string;
  description: string;
  calendarId: string;
  htmlLink: string;
}

/** Google API → CalendarEvent 変換 */
export function toCalendarEvent(
  event: GoogleEvent,
  calendarId: string
): CalendarEvent {
  const isAllDay = !event.start.dateTime;
  return {
    id: event.id,
    title: event.summary || '(no title)',
    startTime: event.start.dateTime || event.start.date || '',
    endTime: event.end.dateTime || event.end.date || '',
    isAllDay,
    location: event.location || '',
    description: event.description || '',
    calendarId,
    htmlLink: event.htmlLink || '',
  };
}
