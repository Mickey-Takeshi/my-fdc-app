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
