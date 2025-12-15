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
