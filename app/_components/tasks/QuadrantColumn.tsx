/**
 * app/_components/tasks/QuadrantColumn.tsx
 *
 * Phase 9: 4象限カラム
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Task, Suit, TaskStatus } from '@/lib/types/task';
import { SUIT_CONFIG } from '@/lib/types/task';
import { TaskCard } from './TaskCard';

interface QuadrantColumnProps {
  suit: Suit;
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

export function QuadrantColumn({
  suit,
  tasks,
  onStatusChange,
  onDelete,
}: QuadrantColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `quadrant-${suit}`,
    data: { suit },
  });

  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const config = SUIT_CONFIG[suit];

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? '#f0f7ff' : '#fafafa',
        borderRadius: '12px',
        padding: '16px',
        minHeight: '300px',
        border: isOver ? '2px dashed #2196f3' : '2px solid transparent',
        transition: 'all 0.2s',
      }}
    >
      {/* ヘッダー */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              color: config.color,
            }}
          >
            {config.symbol}
          </span>
          <span style={{ fontWeight: 600 }}>{config.en}</span>
          <span
            style={{
              marginLeft: 'auto',
              background: '#e0e0e0',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
            }}
          >
            {activeTasks.length}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
          {config.ja}
        </div>
      </div>

      {/* 未完了タスク */}
      {activeTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={(status) => onStatusChange(task.id, status)}
          onDelete={() => onDelete(task.id)}
        />
      ))}

      {/* 完了タスク（折りたたみ） */}
      {doneTasks.length > 0 && (
        <details style={{ marginTop: '16px' }}>
          <summary
            style={{
              fontSize: '12px',
              color: 'var(--text-light)',
              cursor: 'pointer',
            }}
          >
            完了済み ({doneTasks.length})
          </summary>
          <div style={{ marginTop: '8px' }}>
            {doneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={(status) => onStatusChange(task.id, status)}
                onDelete={() => onDelete(task.id)}
              />
            ))}
          </div>
        </details>
      )}

      {/* 空状態 */}
      {tasks.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-light)',
            fontSize: '14px',
          }}
        >
          タスクをドラッグしてここに追加
        </div>
      )}
    </div>
  );
}
