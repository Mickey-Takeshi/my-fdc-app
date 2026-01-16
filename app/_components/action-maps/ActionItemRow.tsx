/**
 * app/_components/action-maps/ActionItemRow.tsx
 *
 * Phase 10: ActionItem行コンポーネント
 */

'use client';

import { useState } from 'react';
import type { ActionItem, ActionItemStatus, ActionItemPriority } from '@/lib/types/action-map';

interface ActionItemRowProps {
  item: ActionItem;
  onUpdate: (itemId: string, updates: Partial<ActionItem>) => void;
  onDelete: (itemId: string) => void;
  onOpenTaskLink?: (itemId: string) => void;
}

const statusLabels: Record<ActionItemStatus, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  blocked: 'ブロック',
  done: '完了',
};

const statusColors: Record<ActionItemStatus, string> = {
  not_started: 'var(--text-light)',
  in_progress: 'var(--primary)',
  blocked: 'var(--warning)',
  done: 'var(--success)',
};

const priorityLabels: Record<ActionItemPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

const priorityColors: Record<ActionItemPriority, string> = {
  low: 'var(--text-light)',
  medium: 'var(--primary)',
  high: 'var(--danger)',
};

export function ActionItemRow({ item, onUpdate, onDelete, onOpenTaskLink }: ActionItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);

  const progressRate = item.progressRate ?? 0;
  const taskCount = item.taskCount ?? 0;
  const completedTaskCount = item.completedTaskCount ?? 0;

  const handleTitleSave = () => {
    if (title.trim() && title !== item.title) {
      onUpdate(item.id, { title: title.trim() });
    }
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: ActionItemStatus) => {
    onUpdate(item.id, { status: newStatus });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* ステータスインジケータ */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColors[item.status],
          flexShrink: 0,
        }}
      />

      {/* タイトル */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') {
                setTitle(item.title);
                setIsEditing(false);
              }
            }}
            autoFocus
            style={{
              width: '100%',
              padding: '4px 8px',
              fontSize: '14px',
              border: '1px solid var(--primary)',
              borderRadius: '4px',
              outline: 'none',
            }}
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            style={{
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: item.status === 'done' ? 'line-through' : 'none',
              color: item.status === 'done' ? 'var(--text-light)' : 'inherit',
            }}
          >
            {item.title}
          </span>
        )}
      </div>

      {/* Task紐付けボタン */}
      {onOpenTaskLink && (
        <button
          onClick={() => onOpenTaskLink(item.id)}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Task紐付け"
        >
          <span style={{ fontSize: '10px' }}>🔗</span>
          <span>{taskCount}</span>
        </button>
      )}

      {/* 進捗表示 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-light)',
          flexShrink: 0,
        }}
      >
        <span>{completedTaskCount}/{taskCount}</span>
        <div
          style={{
            width: '60px',
            height: '4px',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressRate}%`,
              backgroundColor: progressRate === 100 ? 'var(--success)' : 'var(--primary)',
            }}
          />
        </div>
        <span style={{ width: '32px', textAlign: 'right' }}>{progressRate}%</span>
      </div>

      {/* 優先度 */}
      <span
        style={{
          fontSize: '12px',
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: 'var(--bg-muted)',
          color: priorityColors[item.priority],
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {priorityLabels[item.priority]}
      </span>

      {/* ステータス変更 */}
      <select
        value={item.status}
        onChange={(e) => handleStatusChange(e.target.value as ActionItemStatus)}
        style={{
          padding: '4px 8px',
          fontSize: '12px',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          backgroundColor: 'var(--card-bg)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {/* 削除ボタン */}
      <button
        onClick={() => onDelete(item.id)}
        style={{
          padding: '4px 8px',
          fontSize: '12px',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: 'transparent',
          color: 'var(--danger)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        削除
      </button>
    </div>
  );
}
