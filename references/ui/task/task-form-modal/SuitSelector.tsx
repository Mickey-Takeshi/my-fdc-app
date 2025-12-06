/**
 * app/_components/todo/task-form-modal/SuitSelector.tsx
 *
 * 4象限選択コンポーネント
 */

'use client';

import React from 'react';
import type { Suit } from '@/lib/types/todo';
import { SUIT_CONFIG } from '@/lib/types/todo';

interface SuitSelectorProps {
  selectedSuit?: Suit;
  onSelectSuit: (suit: Suit) => void;
}

export function SuitSelector({ selectedSuit, onSelectSuit }: SuitSelectorProps) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 500,
          fontSize: '14px',
        }}
      >
        象限
      </label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}
      >
        {(Object.keys(SUIT_CONFIG) as Suit[]).map((suit) => {
          const config = SUIT_CONFIG[suit];
          const isSelected = selectedSuit === suit;
          return (
            <button
              key={suit}
              type="button"
              onClick={() => onSelectSuit(suit)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                border: isSelected
                  ? `2px solid ${config.color}`
                  : '1px solid var(--border)',
                borderRadius: '8px',
                background: isSelected ? `${config.color}10` : 'white',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '20px' }}>{config.symbol}</span>
              <div>
                <div
                  style={{
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: '13px',
                  }}
                >
                  {config.ja}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                  {config.en}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
