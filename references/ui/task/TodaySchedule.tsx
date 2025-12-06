/**
 * app/_components/todo/TodaySchedule.tsx
 *
 * Phase 14.35: 今日のスケジュール表示コンポーネント
 * 830行 → 約230行 (72%削減)
 *
 * 【機能】
 * - Google Calendar から今日の予定を取得・表示
 * - FDC タスクと外部予定を視覚的に区別
 * - 時間軸に沿ったタイムライン表示
 * - 現在時刻インジケーター
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  CalendarEvent,
  EventCategory,
  ScheduleDateSelection,
  TodayScheduleProps,
  EventItem,
  getDurationMinutes,
  getDateLabel,
  getDateOffset,
  getActualDate,
  formatDateWithWeekday,
  isUnclassifiedEvent,
} from './today-schedule';

// 型の再エクスポート
export type { EventCategory, EventToTaskData, ScheduleDateSelection } from './today-schedule';

// デフォルト値
const DEFAULT_CALENDAR_IDS = ['primary'];

export function TodaySchedule({
  selectedCalendarIds,
  compact = false,
  onCreateTaskFromEvent,
  externalSelectedDate,
}: TodayScheduleProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [_currentTime, setCurrentTime] = useState(new Date());
  const [internalSelectedDate, setInternalSelectedDate] = useState<ScheduleDateSelection>('today');

  const selectedDate = externalSelectedDate ?? internalSelectedDate;
  const setSelectedDate = externalSelectedDate ? () => {} : setInternalSelectedDate;
  const calendarIds = selectedCalendarIds ?? DEFAULT_CALENDAR_IDS;
  const calendarIdsKey = JSON.stringify(calendarIds);

  // 現在時刻を1分ごとに更新
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // イベント取得
  const fetchEvents = useCallback(async (ids: string[], dateSelection: ScheduleDateSelection = 'today') => {
    setLoading(true);
    setError(null);
    // 日付変更時に古いイベントをクリア
    setEvents([]);

    try {
      const params = new URLSearchParams({
        calendarIds: ids.join(','),
        dateOffset: getDateOffset(dateSelection).toString(),
      });

      const response = await fetch(`/api/google/calendars/today?${params}`);

      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error(`API Error: ${response.status}`);
        }

        if (response.status === 400 && data.error === 'Google API not connected') {
          setEvents([]);
          setLoading(false);
          return;
        }
        if (response.status === 401) {
          throw new Error(data.message || 'Google再連携が必要です');
        }
        throw new Error(data.message || data.error || `API Error: ${response.status}`);
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('[TodaySchedule] Error:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('ネットワークエラー。しばらく待ってから更新してください。');
      } else {
        setError(err instanceof Error ? err.message : '予定の取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回読み込み＆カレンダーID変更時＆日付変更時
  useEffect(() => {
    fetchEvents(calendarIds, selectedDate);
  }, [calendarIdsKey, selectedDate, calendarIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // イベントを時系列でソート
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events]);

  // イベントからタスクを作成
  const handleCreateTaskFromEvent = useCallback((event: CalendarEvent, category: EventCategory) => {
    if (!onCreateTaskFromEvent) return;

    const displayTitle = event.summary.replace(/\[♠\]|\[♥\]|\[♦\]|\[♣\]\s*/g, '').trim();
    const duration = getDurationMinutes(event.start, event.end);

    onCreateTaskFromEvent({
      title: displayTitle,
      description: event.description,
      estimatedMinutes: duration,
      startTime: event.start,
      endTime: event.end,
      calendarEventId: event.id,
      calendarId: event.calendarId,
      category,
    });
  }, [onCreateTaskFromEvent]);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* ヘッダー */}
      <ScheduleHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        externalSelectedDate={externalSelectedDate}
        sortedEventsCount={sortedEvents.length}
        loading={loading}
        compact={compact}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        onRefresh={() => fetchEvents(calendarIds, selectedDate)}
      />

      {/* コンテンツ */}
      {isExpanded && (
        <div style={{ padding: '12px' }}>
          {loading && <LoadingState />}
          {error && <ErrorState message={error} />}
          {!loading && !error && sortedEvents.length === 0 && (
            <EmptyState dateLabel={getDateLabel(selectedDate)} />
          )}
          {!loading && !error && sortedEvents.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sortedEvents.map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  isNow={false}
                  isPast={false}
                  isUnclassified={isUnclassifiedEvent(event)}
                  onCreateTask={onCreateTaskFromEvent ? (cat) => handleCreateTaskFromEvent(event, cat) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ヘッダーコンポーネント
function ScheduleHeader({
  selectedDate,
  setSelectedDate,
  externalSelectedDate,
  sortedEventsCount,
  loading,
  compact,
  isExpanded,
  onToggleExpand,
  onRefresh,
}: {
  selectedDate: ScheduleDateSelection;
  setSelectedDate: (date: ScheduleDateSelection) => void;
  externalSelectedDate?: ScheduleDateSelection;
  sortedEventsCount: number;
  loading: boolean;
  compact: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRefresh: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--bg-gray)',
        borderBottom: '1px solid var(--border)',
        cursor: compact ? 'pointer' : 'default',
      }}
      onClick={() => compact && onToggleExpand()}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={18} style={{ color: 'var(--primary)' }} />
        <span style={{ fontWeight: 600, fontSize: '14px' }}>予定</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>
          {formatDateWithWeekday(getActualDate(selectedDate))}
        </span>
        {sortedEventsCount > 0 && (
          <span style={{ fontSize: '12px', color: 'var(--text-light)', background: 'white', padding: '2px 8px', borderRadius: '10px' }}>
            {sortedEventsCount}件
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!externalSelectedDate && (
          <DateSelector selectedDate={selectedDate} onSelect={setSelectedDate} />
        )}
        <RefreshButton loading={loading} onRefresh={onRefresh} />
        {compact && (
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

// 日付セレクターコンポーネント
function DateSelector({ selectedDate, onSelect }: { selectedDate: ScheduleDateSelection; onSelect: (date: ScheduleDateSelection) => void }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {(['yesterday', 'today', 'tomorrow'] as ScheduleDateSelection[]).map((date) => (
        <button
          key={date}
          onClick={(e) => { e.stopPropagation(); onSelect(date); }}
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: selectedDate === date ? 600 : 400,
            background: selectedDate === date ? 'var(--primary)' : 'white',
            color: selectedDate === date ? 'white' : 'var(--text-dark)',
            border: selectedDate === date ? 'none' : '1px solid var(--border)',
            borderRadius: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {getDateLabel(date)}
        </button>
      ))}
    </div>
  );
}

// 更新ボタン
function RefreshButton({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onRefresh(); }}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
      title="更新"
    >
      <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
    </button>
  );
}

// 状態表示コンポーネント
function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '8px' }}>
      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>読み込み中...</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#ffebee', borderRadius: '8px', color: '#c62828', fontSize: '14px' }}>
      <AlertCircle size={16} />
      {message}
    </div>
  );
}

function EmptyState({ dateLabel }: { dateLabel: string }) {
  return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)' }}>
      <Calendar size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
      <p style={{ margin: 0, fontSize: '14px' }}>{dateLabel}の予定はありません</p>
    </div>
  );
}

export default TodaySchedule;
