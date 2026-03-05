'use client';

/**
 * app/(app)/dashboard/_components/TodaySchedule.tsx
 *
 * 今日のカレンダー予定表示 + タスク化機能（Phase 13）
 */

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Loader,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import type { CalendarEvent } from '@/lib/types/google-calendar';
import { SUIT_LABELS, SUIT_SYMBOLS, type Suit } from '@/lib/types/task';

interface TodayScheduleProps {
  workspaceId: string;
  onTaskCreated?: () => void;
}

export default function TodaySchedule({ workspaceId, onTaskCreated }: TodayScheduleProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [showSuitPicker, setShowSuitPicker] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayEvents();
  }, [workspaceId]);

  const fetchTodayEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const res = await fetch(
        `/api/google/calendars/events?calendar_id=primary&time_min=${todayStart.toISOString()}&time_max=${todayEnd.toISOString()}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!res.ok) {
        if (res.status === 403) {
          setError('Google Calendar 連携が無効です');
        } else {
          setError('予定の取得に失敗しました');
        }
        return;
      }

      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setError('ネットワークエラー');
    } finally {
      setLoading(false);
    }
  };

  /** カレンダーイベントをタスクに変換 */
  const handleConvertToTask = async (event: CalendarEvent, suit: Suit | null) => {
    setConvertingId(event.id);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          title: event.title,
          description: event.description
            ? `${event.description}\n\n---\nGoogle Calendar: ${event.htmlLink}`
            : `Google Calendar: ${event.htmlLink}`,
          status: 'not_started',
          suit,
          scheduled_date: event.startTime.split('T')[0] || null,
        }),
      });

      if (res.ok) {
        setShowSuitPicker(null);
        onTaskCreated?.();
      }
    } catch {
      // silent fail
    } finally {
      setConvertingId(null);
    }
  };

  const formatTime = (dateStr: string, isAllDay: boolean) => {
    if (isAllDay) return '終日';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    });
  };

  if (loading) {
    return (
      <div className="calendar-schedule-loading">
        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
        <span>予定を取得中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-schedule-error">
        <AlertCircle size={14} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="calendar-schedule">
      <div className="calendar-schedule-header">
        <Calendar size={16} />
        <span>今日の予定</span>
        <span className="calendar-schedule-count">{events.length}</span>
      </div>

      {events.length === 0 ? (
        <div className="calendar-schedule-empty">
          今日の予定はありません
        </div>
      ) : (
        <div className="calendar-event-list">
          {events.map((event) => (
            <div key={event.id} className="calendar-event-item">
              <div className="calendar-event-time">
                <Clock size={12} />
                <span>
                  {formatTime(event.startTime, event.isAllDay)}
                  {!event.isAllDay && (
                    <> - {formatTime(event.endTime, event.isAllDay)}</>
                  )}
                </span>
              </div>
              <div className="calendar-event-title">{event.title}</div>
              {event.location && (
                <div className="calendar-event-location">
                  <MapPin size={11} />
                  <span>{event.location}</span>
                </div>
              )}
              <div className="calendar-event-actions">
                {event.htmlLink && (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="calendar-event-link"
                    title="Google Calendar で開く"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
                <button
                  className="calendar-event-task-btn"
                  onClick={() =>
                    setShowSuitPicker(
                      showSuitPicker === event.id ? null : event.id
                    )
                  }
                  disabled={convertingId === event.id}
                  title="タスクに変換"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Suit Picker for task conversion */}
              {showSuitPicker === event.id && (
                <div className="calendar-suit-picker">
                  <button
                    onClick={() => handleConvertToTask(event, null)}
                    className="calendar-suit-option"
                  >
                    Joker
                  </button>
                  {(['spade', 'heart', 'diamond', 'club'] as Suit[]).map(
                    (suit) => (
                      <button
                        key={suit}
                        onClick={() => handleConvertToTask(event, suit)}
                        className={`calendar-suit-option suit-${suit}`}
                      >
                        {SUIT_SYMBOLS[suit]} {SUIT_LABELS[suit]}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
