# Phase 13: Google Calendar 連携 - 予定取得と表示

## このPhaseの目標

Google Calendar API を使って予定を取得し、アプリに表示：
- カレンダー一覧の取得
- イベント（予定）の取得
- 今日の予定をダッシュボードに表示
- **未分類イベントの表示とタスク化**

---

## 【重要】アイゼンハワーマトリクス（4象限 + 2特殊）

```
FDC は「緊急度」×「重要度」で4象限に分類します：

                │  緊急              │  緊急でない
────────────────┼────────────────────┼──────────────────────
  重要          │  ♠ spade（黒）    │  ♥ heart（赤）
                │  すぐやる          │  予定に入れ実行
                │  Do Now            │  Schedule
────────────────┼────────────────────┼──────────────────────
  重要でない    │  ♦ diamond（黄）  │  ♣ club（青）
                │  任せる＆自動化    │  未来創造20%タイム
                │  Delegate          │  Create Future
────────────────┴────────────────────┴──────────────────────

＋2つの特殊カテゴリ：
  🃏 joker        → 分類待ち/特殊タスク
  ❓ unclassified → カレンダーから取得したばかり

【フロー】
カレンダーから取得 → 「未分類」としてジョーカーゾーンに表示
                     → ドラッグ&ドロップで象限に分類
                     → tasks テーブルに保存（suit カラム設定）
```

**重要ポイント**:
- カレンダーの予定 ≠ FDC のタスク
- 「緊急度×重要度」で分類するのが FDC の核心機能
- 分類することで時間の使い方が変わる

---

## 習得する新しい概念

- **Google Calendar API**: Googleカレンダーのイベントを取得するAPI
- **カレンダーID**: 各カレンダーの識別子。メインは「primary」
- **タイムゾーン**: 時刻の基準地域。日本は「Asia/Tokyo」
- **RFC3339**: 日時フォーマット。「2025-12-08T10:00:00+09:00」
- **アイゼンハワーマトリクス**: 緊急度×重要度で4象限に分類するフレームワーク
- **Suit（4象限）**: spade（すぐやる）、heart（予定に入れ実行）、diamond（任せる）、club（未来創造）
- **EventCategory**: 4象限 + joker + unclassified の6種類
- **未分類（unclassified）**: カレンダーから取得したばかりで、まだ象限が決まっていない状態

---

## 前提条件

- Phase 12 完了（Calendar スコープ追加済み、provider_token 保存済み）
- Google認証でログインが動作する状態
- users テーブルに google_access_token が保存されている

### 【重要】リフレッシュトークンの取得

Google OAuth でリフレッシュトークンを取得するため、ログインページに以下のパラメータを追加：

**ファイル**: `app/login/page.tsx` の `handleGoogleLogin` 関数

```typescript
const { error: authError } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/api/auth/callback`,
    queryParams: {
      access_type: 'offline',  // リフレッシュトークン取得
      prompt: 'consent',       // 毎回同意画面表示
    },
    scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks',
  },
});
```

| パラメータ | 意味 |
|-----------|------|
| `access_type=offline` | リフレッシュトークンを要求 |
| `prompt=consent` | 同意画面を毎回表示（既存ユーザーでもリフレッシュトークンを取得） |

---

## Step 1: 型定義

### 1.1 Google Calendar 型定義

**ファイル**: `lib/types/google-calendar.ts`

```typescript
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
```

### 確認ポイント

- [ ] `lib/types/google-calendar.ts` が作成された
- [ ] GoogleCalendar, GoogleEvent 型が定義されている
- [ ] CalendarEvent 型（アプリ内用）が定義されている
- [ ] Suit 型と SUIT_INFO が定義されている

---

## Step 2: Google Calendar API ユーティリティ

### 2.1 Calendar API クライアント

**ファイル**: `lib/server/google-calendar.ts`

```typescript
/**
 * lib/server/google-calendar.ts
 *
 * Phase 13: Google Calendar API クライアント
 */

import { getValidAccessToken } from './google-tokens';
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
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    console.error('[Calendar API] No valid access token');
    return null;
  }

  const url = new URL(`${CALENDAR_API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Calendar API] Error:', response.status, errorText);
    return null;
  }

  return response.json();
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
```

### 確認ポイント

- [ ] `lib/server/google-calendar.ts` が作成された
- [ ] getCalendarList 関数が実装されている
- [ ] getEvents 関数が実装されている
- [ ] getTodayEvents 関数が実装されている
- [ ] normalizeEvent 関数が実装されている

---

## Step 3: API Routes 実装

### 3.1 カレンダー一覧 API

**ファイル**: `app/api/google/calendars/route.ts`

```typescript
/**
 * app/api/google/calendars/route.ts
 *
 * Phase 13: カレンダー一覧取得 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { getCalendarList } from '@/lib/server/google-calendar';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const calendars = await getCalendarList(session.userId);

    return NextResponse.json({
      calendars,
      count: calendars.length,
    });
  } catch (error) {
    console.error('Error in GET /api/google/calendars:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.2 イベント一覧 API

**ファイル**: `app/api/google/calendars/events/route.ts`

```typescript
/**
 * app/api/google/calendars/events/route.ts
 *
 * Phase 13: カレンダーイベント取得 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import {
  getEvents,
  getTodayEvents,
  getEventsFromAllCalendars,
  normalizeEvent,
} from '@/lib/server/google-calendar';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId') || 'primary';
    const range = searchParams.get('range') || 'today'; // today, week, month, custom
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');
    const allCalendars = searchParams.get('allCalendars') === 'true';

    let events;

    if (allCalendars) {
      // 全カレンダーから取得
      const options: { timeMin?: Date; timeMax?: Date } = {};

      if (range === 'today') {
        const now = new Date();
        options.timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        options.timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else if (range === 'week') {
        const now = new Date();
        options.timeMin = now;
        options.timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (range === 'month') {
        const now = new Date();
        options.timeMin = now;
        options.timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else if (timeMin && timeMax) {
        options.timeMin = new Date(timeMin);
        options.timeMax = new Date(timeMax);
      }

      events = await getEventsFromAllCalendars(session.userId, options);
    } else {
      // 単一カレンダーから取得
      if (range === 'today') {
        const rawEvents = await getTodayEvents(session.userId, calendarId);
        events = rawEvents.map((e) => normalizeEvent(e, calendarId));
      } else {
        const options: { timeMin?: Date; timeMax?: Date } = {};

        if (range === 'week') {
          const now = new Date();
          options.timeMin = now;
          options.timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (range === 'month') {
          const now = new Date();
          options.timeMin = now;
          options.timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (timeMin && timeMax) {
          options.timeMin = new Date(timeMin);
          options.timeMax = new Date(timeMax);
        }

        const rawEvents = await getEvents(session.userId, calendarId, options);
        events = rawEvents.map((e) => normalizeEvent(e, calendarId));
      }
    }

    return NextResponse.json({
      events,
      count: events.length,
      range,
      calendarId: allCalendars ? 'all' : calendarId,
    });
  } catch (error) {
    console.error('Error in GET /api/google/calendars/events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 確認ポイント

- [ ] `app/api/google/calendars/route.ts` が作成された
- [ ] `app/api/google/calendars/events/route.ts` が作成された
- [ ] range パラメータで today/week/month が指定できる
- [ ] allCalendars パラメータで全カレンダー取得ができる

---

## Step 4: UI コンポーネント実装

### 4.1 イベントアイテムコンポーネント

**ファイル**: `app/_components/calendar/EventItem.tsx`

```typescript
/**
 * app/_components/calendar/EventItem.tsx
 *
 * Phase 13: カレンダーイベント表示コンポーネント
 */

'use client';

import type { CalendarEvent, Suit } from '@/lib/types/google-calendar';
import { SUIT_INFO } from '@/lib/types/google-calendar';

interface EventItemProps {
  event: CalendarEvent;
  onClassify?: (eventId: string, suit: Suit) => void;
  compact?: boolean;
}

export function EventItem({ event, onClassify, compact = false }: EventItemProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const suitInfo = SUIT_INFO[event.suit || 'unclassified'];

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '6px',
          borderLeft: `3px solid ${suitInfo.color}`,
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--text-light)', minWidth: '50px' }}>
          {event.isAllDay ? '終日' : formatTime(event.startTime)}
        </span>
        <span style={{ flex: 1, fontSize: '14px' }}>{event.title}</span>
        <span style={{ fontSize: '14px' }}>{suitInfo.emoji}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: 'var(--card-bg)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${suitInfo.color}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 500, fontSize: '15px' }}>{event.title}</span>
            <span
              style={{
                fontSize: '12px',
                padding: '2px 6px',
                backgroundColor: suitInfo.color + '20',
                color: suitInfo.color,
                borderRadius: '4px',
              }}
            >
              {suitInfo.emoji} {suitInfo.label}
            </span>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
            {event.isAllDay ? (
              '終日'
            ) : (
              <>
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </>
            )}
          </div>

          {event.location && (
            <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>
              📍 {event.location}
            </div>
          )}
        </div>

        {onClassify && event.suit === 'unclassified' && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['spade', 'heart', 'diamond', 'club'] as Suit[]).map((suit) => (
              <button
                key={suit}
                onClick={() => onClassify(event.id, suit)}
                title={SUIT_INFO[suit].description}
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {SUIT_INFO[suit].emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4.2 今日の予定コンポーネント

**ファイル**: `app/_components/calendar/TodaySchedule.tsx`

```typescript
/**
 * app/_components/calendar/TodaySchedule.tsx
 *
 * Phase 13: 今日の予定表示コンポーネント
 */

'use client';

import { useState, useEffect } from 'react';
import type { CalendarEvent, Suit } from '@/lib/types/google-calendar';
import { EventItem } from './EventItem';

interface TodayScheduleProps {
  onClassify?: (eventId: string, suit: Suit) => void;
}

interface ApiCalendarEvent {
  id: string;
  googleEventId: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  htmlLink?: string;
  suit?: 'spade' | 'heart' | 'diamond' | 'club' | 'joker' | 'unclassified';
}

export function TodaySchedule({ onClassify }: TodayScheduleProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayEvents();
  }, []);

  const fetchTodayEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/google/calendars/events?range=today&allCalendars=true');

      if (!response.ok) {
        if (response.status === 401) {
          setError('Google カレンダーに接続されていません');
          return;
        }
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      // Convert string dates to Date objects
      const convertedEvents: CalendarEvent[] = (data.events || []).map((e: ApiCalendarEvent) => ({
        ...e,
        startTime: new Date(e.startTime),
        endTime: new Date(e.endTime),
      }));
      setEvents(convertedEvents);
    } catch (err) {
      console.error('Error fetching today events:', err);
      setError('予定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const dateString = today.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  if (loading) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>
          読み込み中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '14px', color: 'var(--danger)' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px' }}>
          今日の予定
        </h3>
        <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
          {dateString}
        </span>
      </div>

      {events.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-light)',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '8px',
          }}
        >
          今日の予定はありません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              onClassify={onClassify}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4.3 未分類イベント一覧コンポーネント

**ファイル**: `app/_components/calendar/UnclassifiedEvents.tsx`

```typescript
/**
 * app/_components/calendar/UnclassifiedEvents.tsx
 *
 * Phase 13: 未分類イベント一覧（要分類）
 */

'use client';

import { useState, useEffect } from 'react';
import type { CalendarEvent, Suit } from '@/lib/types/google-calendar';
import { EventItem } from './EventItem';

interface UnclassifiedEventsProps {
  onClassify: (eventId: string, suit: Suit) => void;
}

interface ApiCalendarEvent {
  id: string;
  googleEventId: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  htmlLink?: string;
  suit?: 'spade' | 'heart' | 'diamond' | 'club' | 'joker' | 'unclassified';
}

export function UnclassifiedEvents({ onClassify }: UnclassifiedEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/google/calendars/events?range=week&allCalendars=true');
      if (response.ok) {
        const data = await response.json();
        // Convert string dates to Date objects and filter unclassified
        const convertedEvents: CalendarEvent[] = (data.events || [])
          .map((e: ApiCalendarEvent) => ({
            ...e,
            startTime: new Date(e.startTime),
            endTime: new Date(e.endTime),
          }))
          .filter((e: CalendarEvent) => e.suit === 'unclassified');
        setEvents(convertedEvents);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = (eventId: string, suit: Suit) => {
    // UIから削除
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    // 親に通知
    onClassify(eventId, suit);
  };

  if (loading) {
    return <div style={{ padding: '16px', color: 'var(--text-light)' }}>読み込み中...</div>;
  }

  if (events.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-light)',
          backgroundColor: 'var(--bg-muted)',
          borderRadius: '8px',
        }}
      >
        未分類の予定はありません
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>
          未分類の予定（{events.length}件）
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-light)' }}>
          4象限に分類してタスク化しましょう
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {events.map((event) => (
          <EventItem
            key={event.id}
            event={event}
            onClassify={handleClassify}
          />
        ))}
      </div>
    </div>
  );
}
```

### 4.4 コンポーネントのエクスポート

**ファイル**: `app/_components/calendar/index.ts`

```typescript
/**
 * app/_components/calendar/index.ts
 *
 * Phase 13: Calendar コンポーネントのエクスポート
 */

export { EventItem } from './EventItem';
export { TodaySchedule } from './TodaySchedule';
export { UnclassifiedEvents } from './UnclassifiedEvents';
```

### 確認ポイント

- [ ] `app/_components/calendar/EventItem.tsx` が作成された
- [ ] `app/_components/calendar/TodaySchedule.tsx` が作成された
- [ ] `app/_components/calendar/UnclassifiedEvents.tsx` が作成された
- [ ] `app/_components/calendar/index.ts` が作成された

---

## Step 5: ダッシュボードに今日の予定を追加

### 5.1 ダッシュボードページの更新

**ファイル**: `app/(app)/dashboard/page.tsx` に追加

```typescript
// 既存のインポートに追加
import { TodaySchedule } from '@/app/_components/calendar';

// JSX 内の適切な場所に追加
<div className="card" style={{ marginTop: '24px', padding: '20px' }}>
  <TodaySchedule />
</div>
```

### 確認ポイント

- [ ] ダッシュボードに TodaySchedule が表示される
- [ ] 今日の予定が正しく取得・表示される

---

## Step 6: ビルド確認

```bash
npm run build
```

### 確認ポイント

- [ ] TypeScript エラーがない
- [ ] ビルドが成功する

---

## トラブルシューティング

### エラー: `[Calendar API] No valid access token`

**原因**: アクセストークンが期限切れで、リフレッシュトークンがない

**解決方法**:
1. ログインページに `access_type=offline` と `prompt=consent` を追加（Step 0 参照）
2. シークレットウィンドウで再ログイン
3. Google の同意画面で許可

### エラー: `invalid request: both auth code and code verifier should be non-empty`

**原因**: PKCE の code_verifier が Cookie に保存されていない

**解決方法**:
1. ブラウザの Cookie をクリア
2. シークレットウィンドウで http://localhost:3000/login を開く
3. 「Google でログイン」をクリック

### 予定が表示されない

**確認項目**:
1. `users` テーブルに `google_access_token` が保存されているか
2. `google_token_expires_at` が未来の日時か
3. `google_refresh_token` が保存されているか（長期運用に必要）

---

## 完了チェックリスト

### 型定義

- [ ] `lib/types/google-calendar.ts` - Calendar API 型定義
- [ ] GoogleCalendar, GoogleEvent 型
- [ ] CalendarEvent 型（アプリ内用）
- [ ] Suit 型と SUIT_INFO 定数

### サーバーサイド

- [ ] `lib/server/google-calendar.ts` - Calendar API クライアント
- [ ] getCalendarList - カレンダー一覧取得
- [ ] getEvents - イベント取得
- [ ] getTodayEvents - 今日のイベント取得
- [ ] normalizeEvent - イベント正規化

### API Routes

- [ ] `app/api/google/calendars/route.ts` - カレンダー一覧
- [ ] `app/api/google/calendars/events/route.ts` - イベント一覧

### UI コンポーネント

- [ ] `app/_components/calendar/EventItem.tsx` - イベント表示
- [ ] `app/_components/calendar/TodaySchedule.tsx` - 今日の予定
- [ ] `app/_components/calendar/UnclassifiedEvents.tsx` - 未分類イベント
- [ ] `app/_components/calendar/index.ts` - エクスポート

### 機能確認

- [ ] カレンダー一覧が取得できる
- [ ] イベントが取得できる
- [ ] 今日の予定が表示される
- [ ] カレンダーイベントが「未分類」バッジ付きでジョーカーゾーンに表示される
- [ ] 未分類イベントを象限にドラッグ&ドロップできる → **Phase 14**
- [ ] 象限を選んでタスク化すると tasks テーブルに保存される → **Phase 14**

### 習得した概念

- [ ] Google Calendar API の使い方
- [ ] カレンダーID と primary の概念
- [ ] RFC3339 日時フォーマット
- [ ] アイゼンハワーマトリクス（4象限）
- [ ] Suit による分類システム

---

## 次のPhase

Phase 14 では、分類した予定をタスクとして保存し、4象限のタスクボードを実装します：

- ドラッグ&ドロップで象限に分類
- タスクへの変換・保存機能（suit カラム設定）
- 4象限タスクボード UI
