/**
 * app/_components/todo/TodoCard.tsx
 *
 * Phase 10-C: 個別タスクカード
 *
 * 【UI構成】
 * - タスクタイトル
 * - 時間ブロック表示（オプション）
 * - Elastic Habits ストリーク（オプション）
 * - 完了チェックボックス
 * - 削除ボタン（Phase 10-C追加）
 */

'use client';

import React, { useState } from 'react';
import { Trash2, Clock, Flame, Map } from 'lucide-react';
import type { Task, Suit } from '@/lib/types/todo';
import { SUIT_CONFIG, SUIT_EMOJI, ELASTIC_CONFIG, BADGE_CONFIG, getTaskBadges } from '@/lib/types/todo';

// スート絵文字アイコン（⬛🟥🟨🟦）
function SuitIcon({ suit, size = 16 }: { suit?: Suit; size?: number }) {
  if (!suit) {
    // ジョーカー（分類待ち）
    return (
      <span style={{ fontSize: size }}>🃏</span>
    );
  }
  const emoji = SUIT_EMOJI[suit];
  return (
    <span style={{ fontSize: size }}>{emoji}</span>
  );
}

// ========================================
// 型定義
// ========================================

interface TodoCardProps {
  task: Task;
  onClick?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  onLinkedHabitComplete?: (habitId: string, completed: boolean) => void;
  longestStreak?: number;
  /** Phase 11: Action Item 紐付け情報 */
  linkedActionItemTitle?: string;
  /** ドラッグ中のコンパクト表示 */
  compact?: boolean;
}

// ========================================
// メインコンポーネント
// ========================================

export function TodoCard({ task, onClick, onComplete, onDelete, onLinkedHabitComplete, longestStreak = 0, linkedActionItemTitle, compact = false }: TodoCardProps) {
  // 分類待ち（joker）はメインカラーを使用
  const isJoker = !task.suit;
  const suitConfig = task.suit ? SUIT_CONFIG[task.suit] : { symbol: '🃏', color: 'var(--primary)', ja: '分類待ち', en: 'Unclassified' };
  // 分類待ちの場合はCSS変数のアルファ版を使用、それ以外は16進数+透明度
  const borderColor = isJoker ? 'var(--primary-alpha-30)' : `${suitConfig.color}30`;
  const badges = getTaskBadges(task, longestStreak);
  const isCompleted = task.status === 'done';
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // コンパクトモード（ドラッグ中）はタイトルのみ表示
  if (compact) {
    return (
      <div
        className="todo-card todo-card-compact"
        style={{
          background: 'white',
          borderRadius: '6px',
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: isJoker ? '2px solid var(--primary)' : `2px solid ${suitConfig.color}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '16px' }}>{suitConfig.symbol}</span>
        <span style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-dark)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {task.title}
        </span>
      </div>
    );
  }

  return (
    <div
      className="todo-card"
      onClick={onClick}
      style={{
        background: isCompleted ? 'var(--bg-gray)' : 'white',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        cursor: 'pointer',
        opacity: isCompleted ? 0.6 : 1,
        border: `1px solid ${borderColor}`,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
      }}
    >
      {/* ヘッダー行 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        {/* 完了チェックボックス */}
        <input
          type="checkbox"
          checked={isCompleted}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onChange={(e) => {
            e.stopPropagation();
            onComplete?.();
          }}
          style={{
            width: '18px',
            height: '18px',
            cursor: 'pointer',
            accentColor: suitConfig.color,
            flexShrink: 0,
            marginTop: '2px',
          }}
        />

        {/* タイトル */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 500,
              fontSize: '14px',
              textDecoration: isCompleted ? 'line-through' : 'none',
              color: isCompleted ? 'var(--text-light)' : 'var(--text-dark)',
              lineHeight: 1.4,
            }}
          >
            {task.title}
          </p>

          {/* メタ情報 */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '6px',
              fontSize: '12px',
              color: 'var(--text-light)',
              flexWrap: 'wrap',
            }}
          >
            {/* 時間ブロック */}
            {task.startAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Clock size={12} /> {task.startAt}
                {task.durationMinutes && ` (${task.durationMinutes}分)`}
              </span>
            )}

            {/* Elastic Habits */}
            {task.isElasticHabit && task.elasticLevel && (
              <span
                style={{
                  background: suitConfig.color + '20',
                  color: suitConfig.color,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 500,
                }}
              >
                {ELASTIC_CONFIG[task.elasticLevel].ja}
              </span>
            )}

            {/* Phase 11: Action Map 紐付けバッジ */}
            {linkedActionItemTitle && (
              <span
                title={`Action Item: ${linkedActionItemTitle}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: '#2196F320',
                  color: '#2196F3',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 500,
                  fontSize: '11px',
                }}
              >
                <Map size={10} /> AM
              </span>
            )}
          </div>
        </div>

        {/* スートアイコン + 削除ボタン */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <SuitIcon suit={task.suit} size={18} />

          {/* 削除ボタン */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.5,
                transition: 'opacity 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.background = '#ffebee';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.5';
                e.currentTarget.style.background = 'none';
              }}
              title="削除"
            >
              <Trash2 size={14} color="#c62828" />
            </button>
          )}
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: '8px',
            padding: '10px',
            background: '#ffebee',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        >
          <p style={{ margin: '0 0 8px', color: '#c62828' }}>
            このタスクを削除しますか？
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
                onDelete?.();
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

      {/* ストリーク & バッジ */}
      {task.isElasticHabit && (task.streakCount ?? 0) > 0 && (
        <div
          style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px dashed var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
          }}
        >
          {/* ストリーク */}
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={14} color="#e65100" /> {task.streakCount}日連続
          </span>

          {/* バッジ */}
          {badges.map((badge) => (
            <span
              key={badge}
              title={BADGE_CONFIG[badge].description}
              style={{
                fontSize: '14px',
              }}
            >
              {BADGE_CONFIG[badge].emoji}
            </span>
          ))}
        </div>
      )}

      {/* サブタスク */}
      {task.subTasks && task.subTasks.length > 0 && (
        <div
          style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px dashed var(--border)',
            fontSize: '12px',
            color: 'var(--text-medium)',
          }}
        >
          {task.subTasks.filter((s) => s.completed).length}/{task.subTasks.length} 完了
        </div>
      )}

      {/* Phase 10-E: 紐付けられた梅習慣 */}
      {task.linkedUmeHabits && task.linkedUmeHabits.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px dashed var(--border)',
          }}
        >
          {/* 進捗バー */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontSize: '12px',
              color: 'var(--text-light)',
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              {task.linkedUmeHabits.map((lh, idx) => (
                <span
                  key={idx}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: lh.completed ? '#4CAF50' : '#e0e0e0',
                  }}
                />
              ))}
            </div>
            <span>
              {task.linkedUmeHabits.filter(lh => lh.completed).length}/
              {task.linkedUmeHabits.length} 完了
            </span>
          </div>

          {/* 個別の梅習慣チェックリスト */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {task.linkedUmeHabits.map((lh) => (
              <label
                key={lh.habitId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  background: lh.completed ? '#E8F5E9' : '#f5f5f5',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <input
                  type="checkbox"
                  checked={lh.completed}
                  onChange={(e) => {
                    e.stopPropagation();
                    onLinkedHabitComplete?.(lh.habitId, !lh.completed);
                  }}
                  style={{
                    width: '14px',
                    height: '14px',
                    cursor: 'pointer',
                    accentColor: '#4CAF50',
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    textDecoration: lh.completed ? 'line-through' : 'none',
                    color: lh.completed ? 'var(--text-light)' : 'var(--text-dark)',
                  }}
                >
                  {lh.title}（5分）
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TodoCard;
