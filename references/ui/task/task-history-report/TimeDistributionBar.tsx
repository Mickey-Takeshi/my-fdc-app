/**
 * app/_components/todo/task-history-report/TimeDistributionBar.tsx
 *
 * 時間配分バーコンポーネント
 */

'use client';

import React from 'react';
import type { Suit } from '@/lib/types/todo';
import { SUIT_CONFIG } from '@/lib/types/todo';
import { formatMinutes } from './utils';
import type { TimeDistributionBarProps } from './types';

export function TimeDistributionBar({
  spadeMinutes,
  heartMinutes,
  diamondMinutes,
  clubMinutes,
  totalMinutes,
}: TimeDistributionBarProps) {
  if (totalMinutes === 0) {
    return (
      <div
        style={{
          height: '8px',
          background: '#e0e0e0',
          borderRadius: '4px',
        }}
      />
    );
  }

  const segments = [
    { suit: 'spade' as Suit, minutes: spadeMinutes, color: SUIT_CONFIG.spade.color },
    { suit: 'heart' as Suit, minutes: heartMinutes, color: SUIT_CONFIG.heart.color },
    { suit: 'diamond' as Suit, minutes: diamondMinutes, color: SUIT_CONFIG.diamond.color },
    { suit: 'club' as Suit, minutes: clubMinutes, color: SUIT_CONFIG.club.color },
  ].filter((s) => s.minutes > 0);

  return (
    <div
      style={{
        display: 'flex',
        height: '8px',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      {segments.map((seg) => (
        <div
          key={seg.suit}
          style={{
            width: `${(seg.minutes / totalMinutes) * 100}%`,
            background: seg.color,
          }}
          title={`${SUIT_CONFIG[seg.suit].ja}: ${formatMinutes(seg.minutes)}`}
        />
      ))}
    </div>
  );
}
