/**
 * app/_components/todo/ume-habit-manager/UmeHabitCard.tsx
 *
 * 梅習慣カード
 */

'use client';

import React, { useState } from 'react';
import { Plus, Flame, Edit2, Trash2, Check } from 'lucide-react';
import { SUIT_CONFIG } from '@/lib/types/todo';
import { SuitIcon } from './SuitIcon';
import type { UmeHabitCardProps } from './types';

export function UmeHabitCard({
  habit,
  onEdit,
  onDelete,
  onComplete,
  onAddToTask,
}: UmeHabitCardProps) {
  const config = SUIT_CONFIG[habit.suit];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 今日完了済みかどうか
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.lastCompletedAt === today;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '10px',
        padding: '14px',
        border: `1px solid ${config.color}30`,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* スートアイコン */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: `${config.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SuitIcon suit={habit.suit} size={16} />
        </div>

        {/* タイトル＆説明 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
            {habit.title}
          </h4>
          {habit.description && (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '12px',
                color: 'var(--text-light)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {habit.description}
            </p>
          )}
        </div>

        {/* ストリーク */}
        {habit.streakCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '3px 8px',
              background: '#FFF3E0',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#E65100',
            }}
          >
            <Flame size={12} />
            {habit.streakCount}
          </div>
        )}
      </div>

      {/* アクション */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {/* 完了ボタン */}
        <button
          onClick={onComplete}
          disabled={isCompletedToday}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '8px',
            background: isCompletedToday ? '#e8f5e9' : config.color,
            color: isCompletedToday ? '#2e7d32' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isCompletedToday ? 'default' : 'pointer',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          <Check size={14} />
          {isCompletedToday ? '完了済み' : '5分完了'}
        </button>

        {/* タスクに追加 */}
        {onAddToTask && (
          <button
            onClick={onAddToTask}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-gray)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="今日のタスクに追加"
          >
            <Plus size={14} />
          </button>
        )}

        {/* 編集 */}
        <button
          onClick={onEdit}
          style={{
            padding: '8px',
            background: 'var(--bg-gray)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
          title="編集"
        >
          <Edit2 size={14} />
        </button>

        {/* 削除 */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            padding: '8px',
            background: 'var(--bg-gray)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
          title="削除"
        >
          <Trash2 size={14} color="#c62828" />
        </button>
      </div>

      {/* 削除確認 */}
      {showDeleteConfirm && (
        <div
          style={{
            padding: '10px',
            background: '#ffebee',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        >
          <p style={{ margin: '0 0 8px', color: '#c62828' }}>
            「{habit.title}」を削除しますか？
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                padding: '4px 12px',
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              キャンセル
            </button>
            <button
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              style={{
                padding: '4px 12px',
                background: '#c62828',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
