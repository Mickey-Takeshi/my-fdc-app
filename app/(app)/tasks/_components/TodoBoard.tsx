'use client';

/**
 * app/(app)/tasks/_components/TodoBoard.tsx
 *
 * 4象限ボード（Phase 9）
 * アイゼンハワーマトリクス + Jokerゾーン
 * @dnd-kit によるドラッグ&ドロップ
 */

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { ALL_SUITS, type Task, type Suit, type TaskStatus } from '@/lib/types/task';
import QuadrantColumn from './QuadrantColumn';
import JokerZone from './JokerZone';

interface TodoBoardProps {
  tasks: Task[];
  onSuitChange: (taskId: string, suit: Suit | null) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onSelect: (task: Task) => void;
}

export default function TodoBoard({
  tasks,
  onSuitChange,
  onStatusChange,
  onSelect,
}: TodoBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // ドロップ先の象限を判定
    if (overId.startsWith('quadrant-')) {
      const targetSuit = overId.replace('quadrant-', '');
      if (targetSuit === 'joker') {
        onSuitChange(taskId, null);
      } else {
        onSuitChange(taskId, targetSuit as Suit);
      }
    }
  };

  // タスクを象限ごとに分類
  const jokerTasks = tasks.filter((t) => !t.suit);
  const suitTasks: Record<Suit, Task[]> = {
    spade: [],
    heart: [],
    diamond: [],
    club: [],
  };

  for (const task of tasks) {
    if (task.suit && suitTasks[task.suit]) {
      suitTasks[task.suit].push(task);
    }
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Jokerゾーン */}
      <JokerZone
        tasks={jokerTasks}
        onStatusChange={onStatusChange}
        onSelect={onSelect}
      />

      {/* 4象限ボード */}
      <div className="quadrant-board">
        {ALL_SUITS.map((suit) => (
          <QuadrantColumn
            key={suit}
            suit={suit}
            tasks={suitTasks[suit]}
            onStatusChange={onStatusChange}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeTask ? (
          <div className="todo-card todo-card-overlay">
            <div className="todo-card-body">
              <div className="todo-card-title">
                {activeTask.title}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
