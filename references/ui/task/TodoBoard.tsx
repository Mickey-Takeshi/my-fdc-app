/**
 * app/_components/todo/TodoBoard.tsx
 *
 * Phase 15: 習慣ブロック削除版
 * 4象限ボードUI（ドラッグ&ドロップ対応）
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import type { Task, Suit } from '@/lib/types/todo';
import { groupTasksBySuit } from '@/lib/types/todo';
import { JokerZone, type CalendarEventForJoker } from './JokerZone';
import { QuadrantColumn } from './todo-board';
import { TodoCard } from './TodoCard';

// ========================================
// 型定義
// ========================================

interface TodoBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskMove?: (taskId: string, newSuit: Suit) => void;
  onTaskMoveToJoker?: (taskId: string) => void;
  onAddTask?: (suit: Suit) => void;
  onLinkedHabitComplete?: (taskId: string, habitId: string, completed: boolean) => void;
  getLinkedActionItemTitle?: (taskId: string) => string | undefined;
  calendarJokerEvents?: CalendarEventForJoker[];
  onImportCalendarEvent?: (event: CalendarEventForJoker, suit: Suit) => void;
  onDismissCalendarEvent?: (eventId: string) => void;
  calendarJokerLoading?: boolean;
}

// ========================================
// メインコンポーネント
// ========================================

export function TodoBoard({
  tasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
  onTaskMove,
  onTaskMoveToJoker,
  onAddTask,
  onLinkedHabitComplete,
  getLinkedActionItemTitle,
  calendarJokerEvents,
  onImportCalendarEvent,
  onDismissCalendarEvent,
  calendarJokerLoading,
}: TodoBoardProps) {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    })
  );

  const grouped = groupTasksBySuit(tasks);

  // Jokerタスク（suitがundefinedまたは無効なもの）
  const jokerTasks = useMemo(() => {
    return tasks.filter(
      (t) => !t.suit || !['spade', 'heart', 'diamond', 'club'].includes(t.suit)
    );
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  }, [tasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const dropData = over.data.current;

    if (!dropData) return;

    if (dropData.type === 'quadrant' && onTaskMove) {
      const newSuit = dropData.suit as Suit;
      const currentTask = tasks.find((t) => t.id === taskId);
      if (currentTask?.suit === newSuit) return;
      onTaskMove(taskId, newSuit);
    }

    if (dropData.type === 'joker' && onTaskMoveToJoker) {
      onTaskMoveToJoker(taskId);
    }
  }, [tasks, onTaskMove, onTaskMoveToJoker]);

  const GRID_GAP = 16;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '0 16px',
        }}>
          <div
            className="todo-board"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))',
              gridTemplateRows: 'auto auto',
              gap: `${GRID_GAP}px`,
              minWidth: '600px',
            }}
          >
            <QuadrantColumn
              suit="spade"
              tasks={grouped.spade}
              onTaskClick={onTaskClick}
              onTaskComplete={onTaskComplete}
              onTaskDelete={onTaskDelete}
              onLinkedHabitComplete={onLinkedHabitComplete}
              onAddTask={onAddTask}
              getLinkedActionItemTitle={getLinkedActionItemTitle}
              onImportCalendarEvent={onImportCalendarEvent}
            />
            <QuadrantColumn
              suit="heart"
              tasks={grouped.heart}
              onTaskClick={onTaskClick}
              onTaskComplete={onTaskComplete}
              onTaskDelete={onTaskDelete}
              onLinkedHabitComplete={onLinkedHabitComplete}
              onAddTask={onAddTask}
              getLinkedActionItemTitle={getLinkedActionItemTitle}
              onImportCalendarEvent={onImportCalendarEvent}
            />
            <QuadrantColumn
              suit="diamond"
              tasks={grouped.diamond}
              onTaskClick={onTaskClick}
              onTaskComplete={onTaskComplete}
              onTaskDelete={onTaskDelete}
              onLinkedHabitComplete={onLinkedHabitComplete}
              onAddTask={onAddTask}
              getLinkedActionItemTitle={getLinkedActionItemTitle}
              onImportCalendarEvent={onImportCalendarEvent}
            />
            <QuadrantColumn
              suit="club"
              tasks={grouped.club}
              onTaskClick={onTaskClick}
              onTaskComplete={onTaskComplete}
              onTaskDelete={onTaskDelete}
              onLinkedHabitComplete={onLinkedHabitComplete}
              onAddTask={onAddTask}
              getLinkedActionItemTitle={getLinkedActionItemTitle}
              onImportCalendarEvent={onImportCalendarEvent}
            />
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          <JokerZone
            tasks={jokerTasks}
            onTaskClick={onTaskClick}
            onTaskComplete={onTaskComplete}
            onTaskDelete={onTaskDelete}
            onLinkedHabitComplete={onLinkedHabitComplete}
            getLinkedActionItemTitle={getLinkedActionItemTitle}
            calendarJokerEvents={calendarJokerEvents}
            onImportCalendarEvent={onImportCalendarEvent}
            onDismissCalendarEvent={onDismissCalendarEvent}
            calendarJokerLoading={calendarJokerLoading}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeTask ? (
          <div style={{
            transform: 'rotate(3deg) scale(0.85)',
            transformOrigin: 'top left',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.25)',
            opacity: 0.95,
            maxWidth: '200px',
          }}>
            <TodoCard
              task={activeTask}
              compact
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default TodoBoard;
