/**
 * app/_components/todo/task-history-report/SuitBadge.tsx
 *
 * スートバッジコンポーネント
 */

'use client';

import React from 'react';
import type { Suit } from '@/lib/types/todo';
import { SUIT_CONFIG } from '@/lib/types/todo';

interface SuitBadgeProps {
  suit?: Suit;
}

export function SuitBadge({ suit }: SuitBadgeProps) {
  if (!suit) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '4px',
          background: '#e0e0e020',
          color: '#9e9e9e',
          fontSize: '12px',
          fontWeight: 600,
        }}
        title="未分類"
      >
        🃏
      </span>
    );
  }
  const config = SUIT_CONFIG[suit];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        background: `${config.color}20`,
        color: config.color,
        fontSize: '12px',
        fontWeight: 600,
      }}
      title={config.ja}
    >
      {suit === 'spade' && '♠'}
      {suit === 'heart' && '♥'}
      {suit === 'diamond' && '♦'}
      {suit === 'club' && '♣'}
    </span>
  );
}
