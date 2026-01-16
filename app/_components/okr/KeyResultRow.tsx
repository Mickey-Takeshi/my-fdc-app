/**
 * app/_components/okr/KeyResultRow.tsx
 *
 * Phase 11: Key Result行コンポーネント
 */

'use client';

import { useState } from 'react';
import type { KeyResult } from '@/lib/types/okr';

interface KeyResultRowProps {
  kr: KeyResult;
  onUpdate: (krId: string, updates: Partial<KeyResult>) => void;
  onDelete: (krId: string) => void;
}

export function KeyResultRow({ kr, onUpdate, onDelete }: KeyResultRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(kr.currentValue.toString());

  const progress = kr.progress ?? 0;

  const handleSave = () => {
    const newValue = parseFloat(currentValue);
    if (!isNaN(newValue) && newValue !== kr.currentValue) {
      onUpdate(kr.id, { currentValue: newValue });
    }
    setIsEditing(false);
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
      {/* 進捗インジケータ */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: `conic-gradient(${progress >= 100 ? 'var(--success)' : 'var(--primary)'} ${progress * 3.6}deg, var(--bg-muted) 0deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 600,
          }}
        >
          {progress}%
        </div>
      </div>

      {/* タイトル */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500 }}>{kr.title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>
          目標: {kr.targetValue.toLocaleString()} {kr.unit}
        </div>
      </div>

      {/* 現在値入力 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {isEditing ? (
          <>
            <input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setCurrentValue(kr.currentValue.toString());
                  setIsEditing(false);
                }
              }}
              autoFocus
              style={{
                width: '80px',
                padding: '4px 8px',
                fontSize: '14px',
                border: '1px solid var(--primary)',
                borderRadius: '4px',
                textAlign: 'right',
              }}
            />
            <span style={{ fontSize: '14px' }}>{kr.unit}</span>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '4px 12px',
              fontSize: '14px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ fontWeight: 600 }}>{kr.currentValue.toLocaleString()}</span>
            <span style={{ color: 'var(--text-light)' }}>{kr.unit}</span>
          </button>
        )}
      </div>

      {/* 削除ボタン */}
      <button
        onClick={() => onDelete(kr.id)}
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
