/**
 * app/_components/todo/JokerZone.tsx
 *
 * Phase 13 WS-E: TodoBoardから分割
 * Phase 14.9: @dnd-kit に移行（スムーズなドラッグ&ドロップ）
 * 分類待ちゾーン（Joker）のUI
 */

'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Joystick, Calendar, Clock, Timer } from 'lucide-react';
import type { Task, Suit } from '@/lib/types/todo';
import DraggableCard from './DraggableCard';

// ========================================
// 型定義
// ========================================

export interface CalendarEventForJoker {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  calendarId: string;
}

export interface JokerZoneProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onLinkedHabitComplete?: (taskId: string, habitId: string, completed: boolean) => void;
  // Phase 11: Action Item 紐付け情報取得
  getLinkedActionItemTitle?: (taskId: string) => string | undefined;
  // Phase 10-G: Googleカレンダー未分類イベント
  calendarJokerEvents?: CalendarEventForJoker[];
  onImportCalendarEvent?: (event: CalendarEventForJoker, suit: Suit) => void;
  onDismissCalendarEvent?: (eventId: string) => void;
  calendarJokerLoading?: boolean;
}

// ========================================
// 定数
// ========================================

const JOKER_COLOR = '#9E9E9E';
const CALENDAR_COLOR = 'var(--primary)';  // テーマカラー

// ========================================
// コンポーネント
// ========================================

export function JokerZone({
  tasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
  onLinkedHabitComplete,
  getLinkedActionItemTitle,
  calendarJokerEvents,
  onDismissCalendarEvent,
  calendarJokerLoading,
}: JokerZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'joker-zone',
    data: {
      type: 'joker',
    },
  });

  // カレンダーイベントカードのドラッグ開始（HTML5 DnD APIのまま）
  const handleCalendarEventDragStart = (e: React.DragEvent, event: CalendarEventForJoker) => {
    e.dataTransfer.setData('text/plain', `calendar:${event.id}`);
    e.dataTransfer.setData('application/json', JSON.stringify(event));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      ref={setNodeRef}
      className="joker-zone"
      style={{
        background: isOver ? `${JOKER_COLOR}15` : 'var(--bg-white)',
        borderRadius: '12px',
        padding: '16px',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: isOver
          ? `3px dashed ${JOKER_COLOR}`
          : `2px solid ${JOKER_COLOR}30`,
        transition: 'all 200ms ease',
        transform: isOver ? 'scale(1.005)' : 'scale(1)',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingBottom: '12px',
          borderBottom: `2px solid ${JOKER_COLOR}`,
        }}
      >
        <span style={{ fontSize: '24px', display: 'inline-flex' }}>
          <Joystick size={24} color="#9E9E9E" />
        </span>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            分類待ち
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: 'var(--text-light)',
            }}
          >
            Joker / Unclassified
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* タスク数 */}
          <span
            style={{
              background: `${JOKER_COLOR}20`,
              color: JOKER_COLOR,
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {tasks.length}
          </span>
          {/* カレンダーイベント数 */}
          {calendarJokerEvents && calendarJokerEvents.length > 0 && (
            <span
              style={{
                background: `${CALENDAR_COLOR}15`,
                color: CALENDAR_COLOR,
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Googleカレンダーの未分類予定"
            >
              <Calendar size={12} /> {calendarJokerEvents.length}
            </span>
          )}
          {/* ローディング */}
          {calendarJokerLoading && (
            <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>読込中...</span>
          )}
        </div>
      </div>

      {/* タスクリスト（横スクロール対応） */}
      <div
        className="joker-task-list"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '8px',
          overflowX: 'auto',
        }}
      >
        {/* タスクがなく、カレンダーイベントもない場合 */}
        {tasks.length === 0 && (!calendarJokerEvents || calendarJokerEvents.length === 0) ? (
          <p
            style={{
              color: isOver ? JOKER_COLOR : 'var(--text-light)',
              textAlign: 'center',
              padding: '20px',
              fontSize: '14px',
              width: '100%',
              fontWeight: isOver ? 600 : 400,
              transition: 'all 200ms ease',
            }}
          >
            {isOver
              ? 'ここにドロップして分類待ちに'
              : '4象限に分類できないタスクをここにドラッグ'}
          </p>
        ) : (
          <>
            {/* 既存のタスク */}
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  flex: '0 0 auto',
                  minWidth: '200px',
                  maxWidth: '300px',
                }}
              >
                <DraggableCard
                  task={task}
                  onClick={() => onTaskClick?.(task)}
                  onComplete={() => onTaskComplete?.(task.id)}
                  onDelete={onTaskDelete ? () => onTaskDelete(task.id) : undefined}
                  onLinkedHabitComplete={onLinkedHabitComplete ? (habitId, completed) => onLinkedHabitComplete(task.id, habitId, completed) : undefined}
                  linkedActionItemTitle={getLinkedActionItemTitle?.(task.id)}
                />
              </div>
            ))}
            {/* Googleカレンダーの未分類イベント */}
            {calendarJokerEvents && calendarJokerEvents.map((event) => {
              const startTime = new Date(event.start).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });
              const durationMinutes = Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000);

              return (
                <div
                  key={`calendar-${event.id}`}
                  draggable
                  onDragStart={(e) => handleCalendarEventDragStart(e, event)}
                  style={{
                    flex: '0 0 auto',
                    minWidth: '200px',
                    maxWidth: '300px',
                    background: `${CALENDAR_COLOR}08`,
                    border: `2px solid ${CALENDAR_COLOR}40`,
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'grab',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                  title="4象限にドラッグして分類"
                >
                  {/* 分類不要ボタン（×） */}
                  {onDismissCalendarEvent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismissCalendarEvent(event.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '20px',
                        height: '20px',
                        padding: 0,
                        background: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#999',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ffebee';
                        e.currentTarget.style.color = '#c62828';
                        e.currentTarget.style.borderColor = '#ef9a9a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f5f5f5';
                        e.currentTarget.style.color = '#999';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                      title="分類不要（非表示にする）"
                    >
                      ✕
                    </button>
                  )}
                  {/* ヘッダー */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', display: 'inline-flex' }}>
                      <Calendar size={16} color={CALENDAR_COLOR} />
                    </span>
                    <span style={{ fontSize: '11px', color: CALENDAR_COLOR, fontWeight: 600 }}>
                      Googleカレンダー
                    </span>
                  </div>
                  {/* タイトル */}
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-dark)', paddingRight: '16px' }}>
                    {event.summary}
                  </div>
                  {/* 時間情報 */}
                  <div style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <Clock size={12} /> {startTime}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <Timer size={12} /> {durationMinutes}分
                    </span>
                  </div>
                  {/* ヒント */}
                  <div style={{ fontSize: '10px', color: CALENDAR_COLOR, marginTop: '8px', textAlign: 'center' }}>
                    ↑ 象限にドラッグして分類
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default JokerZone;
