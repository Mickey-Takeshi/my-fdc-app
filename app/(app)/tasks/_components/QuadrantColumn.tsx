'use client';

/**
 * app/(app)/tasks/_components/QuadrantColumn.tsx
 *
 * 4象限の各カラム（Phase 9）
 * ドロップターゲットとして機能
 */

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  SUIT_SYMBOLS,
  SUIT_LABELS,
  SUIT_DESCRIPTIONS,
  type Suit,
  type Task,
  type TaskStatus,
} from '@/lib/types/task';
import TodoCard from './TodoCard';

interface QuadrantColumnProps {
  suit: Suit;
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onSelect: (task: Task) => void;
}

export default function QuadrantColumn({
  suit,
  tasks,
  onStatusChange,
  onSelect,
}: QuadrantColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `quadrant-${suit}`,
    data: { suit },
  });

  return (
    <div
      ref={setNodeRef}
      className={`quadrant-column quadrant-${suit} ${isOver ? 'quadrant-column-dragover' : ''}`}
    >
      <div className="quadrant-header">
        <span className={`quadrant-symbol suit-${suit}`}>
          {SUIT_SYMBOLS[suit]}
        </span>
        <div className="quadrant-header-text">
          <span className="quadrant-title">{SUIT_LABELS[suit]}</span>
          <span className="quadrant-desc">{SUIT_DESCRIPTIONS[suit]}</span>
        </div>
        <span className="quadrant-count">{tasks.length}</span>
      </div>

      <div className="quadrant-body">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TodoCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onSelect={onSelect}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="quadrant-empty">
            ドラッグしてタスクを追加
          </div>
        )}
      </div>
    </div>
  );
}
