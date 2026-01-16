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
