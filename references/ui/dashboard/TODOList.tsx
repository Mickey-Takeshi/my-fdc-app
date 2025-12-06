/**
 * app/_components/dashboard/TODOList.tsx
 *
 * Phase 9.92-1: TODO上位5件リストコンポーネント
 *
 * デザイン仕様:
 * - 各TODO: 横並び（チェックボックス・タイトル・期限・カテゴリ）
 * - チェックボックス: 18px × 18px
 * - 期限: 右寄せ
 * - 完了済みTODO: テキストに line-through, 色は var(--text-light)
 * - 期限超過: 赤背景 rgba(244, 67, 54, 0.1), 赤文字
 * - 期限3日以内: 黄背景 rgba(255, 152, 0, 0.1), 黄文字
 */

'use client';

import { Folder, Calendar } from 'lucide-react';
import type { Todo } from '@/lib/types/app-data';

// app-data.ts の Todo 型を再エクスポート（後方互換性）
export type TODOItem = Todo;

export interface TODOListProps {
  todos: Todo[];
  onToggle?: (id: string | number) => void | Promise<void>;
  loading?: boolean;
}

// スケルトン表示件数
const SKELETON_COUNT = 5;

export function TODOList({ todos, onToggle, loading = false }: TODOListProps) {
  // ローディング時はスケルトンを表示
  if (loading) {
    return (
      <section
        style={{ display: 'grid', gap: '10px' }}
        aria-label="TODO一覧を読み込み中"
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <article
            key={i}
            className="card"
            style={{
              padding: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--bg-white)',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* チェックボックススケルトン */}
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                background: 'var(--bg-gray)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />

            {/* TODOタイトルとメタ情報スケルトン */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: `${150 + i * 20}px`,
                  maxWidth: '70%',
                  height: '16px',
                  background: 'var(--bg-gray)',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* カテゴリスケルトン */}
                <div
                  style={{
                    width: '60px',
                    height: '14px',
                    background: 'var(--bg-gray)',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                {/* 期限スケルトン */}
                <div
                  style={{
                    width: '80px',
                    height: '14px',
                    background: 'var(--bg-gray)',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </article>
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </section>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>
          未完了のTODOはありません
        </p>
      </div>
    );
  }

  // 期限の色分け判定
  const getDeadlineStyle = (deadline?: string) => {
    if (!deadline) return {};

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      // 期限超過
      return {
        background: 'rgba(244, 67, 54, 0.1)',
        color: '#f44336',
        fontWeight: 600,
      };
    } else if (daysUntil <= 3) {
      // 期限3日以内
      return {
        background: 'rgba(255, 152, 0, 0.1)',
        color: '#FF9800',
        fontWeight: 600,
      };
    }

    return {};
  };

  return (
    <section
      style={{ display: 'grid', gap: '10px' }}
      aria-label="TODO一覧（上位5件）"
      role="list"
    >
      {todos.slice(0, 5).map((todo) => {
        const deadlineStyle = getDeadlineStyle(todo.deadline);

        return (
          <article
            key={todo.id}
            className="card"
            role="listitem"
            aria-label={`${todo.completed ? '完了: ' : ''}${todo.title}${todo.deadline ? `、期限: ${new Date(todo.deadline).toLocaleDateString('ja-JP')}` : ''}`}
            style={{
              padding: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--bg-white)',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              transition: 'box-shadow 0.2s ease',
              cursor: onToggle ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
            }}
            onClick={() => { onToggle?.(todo.id); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle?.(todo.id);
              }
            }}
            tabIndex={onToggle ? 0 : undefined}
          >
            {/* チェックボックス */}
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={(e) => {
                e.stopPropagation();
                onToggle?.(todo.id);
              }}
              aria-label={`${todo.title}の完了状態を切り替え`}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                accentColor: 'var(--primary)',
              }}
            />

            {/* TODOタイトルとメタ情報 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: '14px',
                  color: todo.completed ? 'var(--text-light)' : 'var(--text-dark)',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {todo.title}
              </div>

              {/* メタ情報 */}
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-light)',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {/* カテゴリ */}
                {todo.category && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Folder size={12} />
                    {todo.category}
                  </span>
                )}

                {/* 期限 */}
                {todo.deadline && (
                  <span
                    style={{
                      ...deadlineStyle,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Calendar size={12} />
                    {new Date(todo.deadline).toLocaleDateString('ja-JP')}
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
