/**
 * lib/server/google-calendar.ts
 *
 * Phase 13: Google Calendar API クライアント
 */

import { callGoogleApi } from './google-api-base';
import type {
  GoogleCalendar,
  GoogleCalendarListResponse,
  GoogleEvent,
  GoogleEventsListResponse,
  CalendarEvent,
} from '@/lib/types/google-calendar';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const TIMEZONE = 'Asia/Tokyo';

/**
 * Google Calendar API を呼び出す
 */
async function callCalendarApi<T>(
  userId: string,
  endpoint: string,
  params?: Record<string, string>
): Promise<T | null> {
  return callGoogleApi<T>(userId, CALENDAR_API_BASE, endpoint, { params });
}

/**
 * カレンダー一覧を取得
 */
export async function getCalendarList(userId: string): Promise<GoogleCalendar[]> {
  const response = await callCalendarApi<GoogleCalendarListResponse>(
    userId,
    '/users/me/calendarList'
  );

  if (!response?.items) {
    return [];
  }

  // 書き込み権限があるカレンダーのみフィルタリング
  return response.items.filter(
    (cal) => cal.accessRole === 'owner' || cal.accessRole === 'writer'
  );
}

/**
 * イベント一覧を取得
 */
export async function getEvents(
  userId: string,
  calendarId: string = 'primary',
  options: {
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
  } = {}
): Promise<GoogleEvent[]> {
  const now = new Date();
  const timeMin = options.timeMin || now;
  const timeMax = options.timeMax || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1週間後

  const params: Record<string, string> = {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',  // 繰り返しイベントを展開
    orderBy: 'startTime',
    timeZone: TIMEZONE,
    maxResults: String(options.maxResults || 100),
  };

  const response = await callCalendarApi<GoogleEventsListResponse>(
    userId,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    params
  );

  if (!response?.items) {
    return [];
  }

  // キャンセルされたイベントを除外
  return response.items.filter((event) => event.status !== 'cancelled');
}

/**
 * 今日のイベントを取得
 */
export async function getTodayEvents(
  userId: string,
  calendarId: string = 'primary'
): Promise<GoogleEvent[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return getEvents(userId, calendarId, {
    timeMin: startOfDay,
    timeMax: endOfDay,
  });
}

/**
 * GoogleEvent を CalendarEvent に変換
 */
export function normalizeEvent(event: GoogleEvent, calendarId: string): CalendarEvent {
  const isAllDay = !event.start.dateTime;

  let startTime: Date;
  let endTime: Date;

  if (isAllDay) {
    // 終日イベント
    startTime = new Date(event.start.date + 'T00:00:00');
    endTime = new Date(event.end.date + 'T00:00:00');
  } else {
    startTime = new Date(event.start.dateTime!);
    endTime = new Date(event.end.dateTime!);
  }

  return {
    id: `gcal_${calendarId}_${event.id}`,
    googleEventId: event.id,
    calendarId,
    title: event.summary || '(タイトルなし)',
    description: event.description,
    location: event.location,
    startTime,
    endTime,
    isAllDay,
    htmlLink: event.htmlLink,
    suit: 'unclassified',  // カレンダーから取得したイベントは未分類
  };
}

/**
 * 複数カレンダーからイベントを取得して統合
 */
export async function getEventsFromAllCalendars(
  userId: string,
  options: {
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
  } = {}
): Promise<CalendarEvent[]> {
  const calendars = await getCalendarList(userId);
  if (calendars.length === 0) {
    return [];
  }

  const allEvents: CalendarEvent[] = [];

  for (const calendar of calendars) {
    const events = await getEvents(userId, calendar.id, options);
    const normalized = events.map((e) => normalizeEvent(e, calendar.id));
    allEvents.push(...normalized);
  }

  // 開始時刻でソート
  allEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return allEvents;
}
