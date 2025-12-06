/**
 * app/_components/todo/elastic-habits-panel/HabitEditModal.tsx
 *
 * 習慣編集モーダル
 */

'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { LEVEL_COLORS_BY_SUIT } from './constants';
import type { HabitEditModalProps } from './types';

export function HabitEditModal({ habit, isOpen, onClose, onSave }: HabitEditModalProps) {
  const [title, setTitle] = useState(habit.title);
  const [description, setDescription] = useState(habit.description || '');
  const [umeLabel, setUmeLabel] = useState(habit.levels.ume.label);
  const [takeLabel, setTakeLabel] = useState(habit.levels.take.label);
  const [matsuLabel, setMatsuLabel] = useState(habit.levels.matsu.label);

  // スートに応じた色
  const levelColors = LEVEL_COLORS_BY_SUIT[habit.suit];

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      title,
      description: description || undefined,
      levels: {
        ume: { label: umeLabel, durationMinutes: 5 },
        take: { label: takeLabel, durationMinutes: 15 },
        matsu: { label: matsuLabel, durationMinutes: 30 },
      },
    });
    onClose();
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
            習慣を編集
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* タイトル */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>
              習慣名
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* 説明 */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>
              説明（任意）
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* 梅・竹・松の内容 */}
          <div style={{ background: 'var(--bg-gray)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ marginBottom: '12px', fontWeight: 500, fontSize: '13px' }}>
              レベル別の具体内容
            </div>

            {/* 梅 */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '12px', color: 'var(--text-light)' }}>
                <span style={{ background: levelColors.ume.bg, color: levelColors.ume.text, padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: `1px solid ${levelColors.ume.text}30` }}>梅</span>
                5分未満
              </label>
              <input
                type="text"
                value={umeLabel}
                onChange={(e) => setUmeLabel(e.target.value)}
                placeholder="例: 本を1ページ読む"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* 竹 */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '12px', color: 'var(--text-light)' }}>
                <span style={{ background: levelColors.take.bg, color: levelColors.take.text, padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: `1px solid ${levelColors.take.text}30` }}>竹</span>
                15分
              </label>
              <input
                type="text"
                value={takeLabel}
                onChange={(e) => setTakeLabel(e.target.value)}
                placeholder="例: 1章読み進める"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* 松 */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '12px', color: 'var(--text-light)' }}>
                <span style={{ background: levelColors.matsu.bg, color: levelColors.matsu.text, padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: `1px solid ${levelColors.matsu.text}30` }}>松</span>
                30分
              </label>
              <input
                type="text"
                value={matsuLabel}
                onChange={(e) => setMatsuLabel(e.target.value)}
                placeholder="例: 集中して読書"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* ボタン */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
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
              onClick={handleSave}
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
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
