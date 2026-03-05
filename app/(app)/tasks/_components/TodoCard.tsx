'use client';

/**
 * app/(app)/tasks/_components/TodoCard.tsx
 *
 * ドラッグ可能なタスクカード（Phase 9, Phase 88: React.memo）
 * @dnd-kit を使用したドラッグ&ドロップ対応
 */

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  CheckCircle2,
  Circle,
  Loader,
  Calendar,
} from 'lucide-react';
import {
  SUIT_SYMBOLS,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from '@/lib/types/task';

interface TodoCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onSelect: (task: Task) => void;
}

// Phase 88: memo to prevent unnecessary re-renders in task list
const TodoCard = memo(function TodoCard({ task, onStatusChange, onSelect }: TodoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusIcon = () => {
    switch (task.status) {
      case 'done':
        return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
      case 'in_progress':
        return <Loader size={16} style={{ color: 'var(--primary)' }} />;
      default:
        return <Circle size={16} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next: Record<TaskStatus, TaskStatus> = {
      not_started: 'in_progress',
      in_progress: 'done',
      done: 'not_started',
    };
    onStatusChange(task.id, next[task.status]);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`todo-card ${task.status === 'done' ? 'todo-card-done' : ''}`}
    >
      <div
        className="todo-card-drag"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </div>

      <button
        className="todo-card-status"
        onClick={cycleStatus}
        title={TASK_STATUS_LABELS[task.status]}
      >
        {statusIcon()}
      </button>

      <div
        className="todo-card-body"
        onClick={() => onSelect(task)}
      >
        <div className={`todo-card-title ${task.status === 'done' ? 'todo-card-title-done' : ''}`}>
          {task.suit && (
            <span className={`todo-card-suit suit-${task.suit}`}>
              {SUIT_SYMBOLS[task.suit]}
            </span>
          )}
          {task.title}
        </div>
        {(task.scheduledDate || task.description) && (
          <div className="todo-card-meta">
            {task.scheduledDate && (
              <span className="todo-card-date">
                <Calendar size={11} />
                {task.scheduledDate}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default TodoCard;
