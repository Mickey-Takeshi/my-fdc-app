/**
 * app/_components/todo/ume-habit-manager/HabitFormModal.tsx
 *
 * 梅習慣のフォームモーダル
 */

'use client';

import React from 'react';
import { X, Timer } from 'lucide-react';
import { SUIT_CONFIG } from '@/lib/types/todo';
import { SuitIcon } from './SuitIcon';
import type { HabitFormModalProps } from './types';

export function HabitFormModal({
  isOpen,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onUpdateField,
}: HabitFormModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '400px',
          margin: '16px',
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            {isEditing ? '梅習慣を編集' : '新しい梅習慣'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 習慣名 */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 500,
                  fontSize: '13px',
                }}
              >
                習慣名 <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => onUpdateField('title', e.target.value)}
                placeholder="例: 読書、ストレッチ、瞑想"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                autoFocus
              />
            </div>

            {/* 説明 */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 500,
                  fontSize: '13px',
                }}
              >
                説明（オプション）
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => onUpdateField('description', e.target.value)}
                placeholder="この習慣の目的や詳細"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* スート選択 */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 500,
                  fontSize: '13px',
                }}
              >
                カテゴリ
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['heart', 'club'] as const).map((suit) => {
                  const config = SUIT_CONFIG[suit];
                  const isSelected = formData.suit === suit;
                  return (
                    <button
                      key={suit}
                      type="button"
                      onClick={() => onUpdateField('suit', suit)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px',
                        border: isSelected
                          ? `2px solid ${config.color}`
                          : '1px solid var(--border)',
                        borderRadius: '8px',
                        background: isSelected ? `${config.color}10` : 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <SuitIcon suit={suit} size={16} />
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? config.color : 'var(--text-dark)',
                        }}
                      >
                        {config.ja.split('（')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 固定5分の表示 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: 'var(--bg-gray)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--text-medium)',
              }}
            >
              <Timer size={16} />
              <span>所要時間: <strong>5分</strong>（固定）</span>
            </div>
          </div>

          {/* ボタン */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '24px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-gray)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {isEditing ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
