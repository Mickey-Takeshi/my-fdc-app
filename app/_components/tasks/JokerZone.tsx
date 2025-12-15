/**
 * app/_components/tasks/JokerZone.tsx
 *
 * Phase 9: 未分類タスク（Joker）ゾーン
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import type { Task, TaskStatus } from '@/lib/types/task';
import { TaskCard } from './TaskCard';

interface JokerZoneProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onAddTask: () => void;
}

export function JokerZone({
  tasks,
  onStatusChange,
  onDelete,
  onAddTask,
}: JokerZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'quadrant-joker',
    data: { suit: null },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? '#fff8e1' : '#fffde7',
        borderRadius: '12px',
        padding: '16px',
        border: isOver ? '2px dashed #ffc107' : '2px solid #fff59d',
        transition: 'all 0.2s',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🃏</span>
            <span style={{ fontWeight: 600 }}>Joker（未分類）</span>
            <span
              style={{
                background: '#ffc107',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            >
              {tasks.length}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
            象限に振り分けてください
          </div>
        </div>

        <button
          onClick={onAddTask}
          className="btn btn-primary btn-small"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={16} />
          タスク追加
        </button>
      </div>

      {/* タスク一覧（横スクロール） */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
        }}
      >
        {tasks.map((task) => (
          <div key={task.id} style={{ minWidth: '250px', maxWidth: '300px' }}>
            <TaskCard
              task={task}
              onStatusChange={(status) => onStatusChange(task.id, status)}
              onDelete={() => onDelete(task.id)}
            />
          </div>
        ))}

        {tasks.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '20px',
              color: 'var(--text-light)',
              fontSize: '14px',
              width: '100%',
            }}
          >
            未分類のタスクはありません
          </div>
        )}
      </div>
    </div>
  );
}
