/**
 * app/_components/todo/DraggableCard.tsx
 *
 * Phase 13 WS-E: TodoBoardから分割
 * Phase 14.9: @dnd-kit に移行（スムーズなドラッグ&ドロップ）
 *
 * ドラッグ可能なタスクカード
 */

'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TodoCard } from './TodoCard';
import type { Task } from '@/lib/types/todo';

// ========================================
// 型定義
// ========================================

export interface DraggableCardProps {
  task: Task;
  onClick?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onLinkedHabitComplete?: (habitId: string, completed: boolean) => void;
  linkedActionItemTitle?: string;
}

// ========================================
// コンポーネント
// ========================================

export function DraggableCard({
  task,
  onClick,
  onComplete,
  onDelete,
  onLinkedHabitComplete,
  linkedActionItemTitle,
}: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'transform 200ms ease, box-shadow 200ms ease',
    zIndex: isDragging ? 1000 : 'auto',
    boxShadow: isDragging
      ? '0 12px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)'
      : undefined,
    scale: isDragging ? '1.02' : '1',
    touchAction: 'none', // タッチデバイス対応
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <TodoCard
        task={task}
        onClick={onClick}
        onComplete={onComplete}
        onDelete={onDelete}
        onLinkedHabitComplete={onLinkedHabitComplete}
        linkedActionItemTitle={linkedActionItemTitle}
      />
    </div>
  );
}

export default DraggableCard;
