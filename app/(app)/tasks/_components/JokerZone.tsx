'use client';

/**
 * app/(app)/tasks/_components/JokerZone.tsx
 *
 * Jokerゾーン（未分類タスク）（Phase 9）
 * suit が未設定のタスクを表示
 */

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { HelpCircle } from 'lucide-react';
import type { Task, TaskStatus } from '@/lib/types/task';
import TodoCard from './TodoCard';

interface JokerZoneProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onSelect: (task: Task) => void;
}

export default function JokerZone({
  tasks,
  onStatusChange,
  onSelect,
}: JokerZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'quadrant-joker',
    data: { suit: null },
  });

  return (
    <div
      ref={setNodeRef}
      className={`joker-zone ${isOver ? 'joker-zone-dragover' : ''}`}
    >
      <div className="joker-header">
        <HelpCircle size={16} />
        <span className="joker-title">Joker (未分類)</span>
        <span className="joker-count">{tasks.length}</span>
      </div>

      <div className="joker-body">
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
          <div className="joker-empty">
            象限が決まっていないタスクがここに表示されます
          </div>
        )}
      </div>
    </div>
  );
}
