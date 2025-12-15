/**
 * app/_components/tasks/TaskCard.tsx
 *
 * Phase 9: ドラッグ可能なタスクカード
 */

'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Check, Clock, Trash2, Link } from 'lucide-react';
import type { Task, TaskStatus } from '@/lib/types/task';
import { SUIT_CONFIG, TASK_STATUS_LABELS } from '@/lib/types/task';

interface ActionItemInfo {
  id: string;
  title: string;
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
  onDelete: () => void;
  actionItem?: ActionItemInfo;
}

export function TaskCard({ task, onStatusChange, onDelete, actionItem }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const suitColor = task.suit ? SUIT_CONFIG[task.suit].color : '#888';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'white',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        boxShadow: isDragging
          ? '0 8px 16px rgba(0,0,0,0.2)'
          : '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${suitColor}`,
        cursor: 'grab',
      }}
      {...attributes}
      {...listeners}
    >
      {/* ActionItem紐付け表示 */}
      {actionItem && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: 'var(--primary)',
            marginBottom: '4px',
          }}
        >
          <Link size={10} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {actionItem.title}
          </span>
        </div>
      )}

      {/* タイトル */}
      <div
        style={{
          fontWeight: 500,
          marginBottom: '8px',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          color: task.status === 'done' ? '#999' : 'inherit',
        }}
      >
        {task.title}
      </div>

      {/* メタ情報 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-light)',
        }}
      >
        {/* ステータス */}
        <span
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background:
              task.status === 'done'
                ? '#e8f5e9'
                : task.status === 'in_progress'
                ? '#fff3e0'
                : '#f5f5f5',
            color:
              task.status === 'done'
                ? '#2e7d32'
                : task.status === 'in_progress'
                ? '#ef6c00'
                : '#666',
          }}
        >
          {TASK_STATUS_LABELS[task.status]}
        </span>

        {/* 予定日 */}
        {task.scheduledDate && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Clock size={12} />
            {task.scheduledDate}
          </span>
        )}

        {/* アクションボタン */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          {task.status !== 'done' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange('done');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#4caf50',
              }}
              title="完了にする"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#f44336',
            }}
            title="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
