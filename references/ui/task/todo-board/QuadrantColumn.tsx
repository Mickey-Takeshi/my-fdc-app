/**
 * app/_components/todo/todo-board/QuadrantColumn.tsx
 *
 * Phase 15: 習慣ブロック削除版
 * 象限カラムコンポーネント（ドロップ可能）
 */

'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Task, Suit } from '@/lib/types/todo';
import { SUIT_CONFIG } from '@/lib/types/todo';
import { Plus } from 'lucide-react';
import { DraggableCard } from '../DraggableCard';
import { SuitIcon } from './SuitIcon';

// カレンダーイベント型（JokerZoneと共通）
interface CalendarEventForDrop {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  calendarId: string;
}

interface QuadrantColumnProps {
  suit: Suit;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onLinkedHabitComplete?: (taskId: string, habitId: string, completed: boolean) => void;
  onAddTask?: (suit: Suit) => void;
  // Phase 11: Action Item 紐付け情報取得
  getLinkedActionItemTitle?: (taskId: string) => string | undefined;
  // カレンダーイベントのドロップ処理（HTML5 DnD用）
  onImportCalendarEvent?: (event: CalendarEventForDrop, suit: Suit) => void;
}

export function QuadrantColumn({
  suit,
  tasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
  onLinkedHabitComplete,
  onAddTask,
  getLinkedActionItemTitle,
  onImportCalendarEvent,
}: QuadrantColumnProps) {
  const config = SUIT_CONFIG[suit];
  const [isHtml5DragOver, setIsHtml5DragOver] = React.useState(false);

  const { isOver, setNodeRef } = useDroppable({
    id: `quadrant-${suit}`,
    data: {
      type: 'quadrant',
      suit,
    },
  });

  // HTML5 DnD ハンドラ（カレンダーイベント用）
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsHtml5DragOver(true);
  };

  const handleDragLeave = () => {
    setIsHtml5DragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHtml5DragOver(false);

    const dataId = e.dataTransfer.getData('text/plain');

    // カレンダーイベントのドロップ処理
    if (dataId.startsWith('calendar:') && onImportCalendarEvent) {
      const eventJson = e.dataTransfer.getData('application/json');
      if (eventJson) {
        try {
          const event = JSON.parse(eventJson) as CalendarEventForDrop;
          onImportCalendarEvent(event, suit);
        } catch (err) {
          console.error('Failed to parse calendar event:', err);
        }
      }
    }
  };

  const isDragOver = isOver || isHtml5DragOver;

  return (
    <div
      ref={setNodeRef}
      className="quadrant-column"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        background: isDragOver ? `${config.color}15` : 'var(--bg-white)',
        borderRadius: '12px',
        padding: '16px',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: isDragOver
          ? `3px dashed ${config.color}`
          : `2px solid ${config.color}20`,
        transition: 'all 200ms ease',
        transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingBottom: '12px',
          borderBottom: `2px solid ${config.color}`,
        }}
      >
        <SuitIcon suit={suit} size={28} />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: config.color }}>
            {config.ja}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: config.color,
              opacity: 0.7,
            }}
          >
            {config.en}
          </p>
        </div>
        <span
          style={{
            background: `${config.color}20`,
            color: config.color,
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* タスクリスト */}
      <div
        className="task-list"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          minHeight: '100px',
        }}
      >
        {tasks.length === 0 ? (
          <p
            style={{
              color: isDragOver ? config.color : 'var(--text-light)',
              textAlign: 'center',
              padding: '20px',
              fontSize: '14px',
              fontWeight: isDragOver ? 600 : 400,
              transition: 'all 200ms ease',
            }}
          >
            {isDragOver ? 'ここにドロップ' : 'タスクがありません'}
          </p>
        ) : (
          tasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
              onComplete={() => onTaskComplete?.(task.id)}
              onDelete={onTaskDelete ? () => onTaskDelete(task.id) : undefined}
              onLinkedHabitComplete={onLinkedHabitComplete ? (habitId, completed) => onLinkedHabitComplete(task.id, habitId, completed) : undefined}
              linkedActionItemTitle={getLinkedActionItemTitle?.(task.id)}
            />
          ))
        )}
      </div>

      {/* 追加ボタン */}
      {onAddTask && (
        <button
          onClick={() => onAddTask(suit)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            background: `${config.color}10`,
            border: `1px dashed ${config.color}50`,
            borderRadius: '8px',
            cursor: 'pointer',
            color: config.color,
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${config.color}20`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${config.color}10`;
          }}
        >
          <Plus size={16} />
          追加
        </button>
      )}
    </div>
  );
}
