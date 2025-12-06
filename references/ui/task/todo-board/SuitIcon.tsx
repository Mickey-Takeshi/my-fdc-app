/**
 * app/_components/todo/todo-board/SuitIcon.tsx
 *
 * スートアイコンコンポーネント
 */

'use client';

import type { Suit } from '@/lib/types/todo';
import { SUIT_CONFIG, SUIT_ICONS } from '@/lib/types/todo';

interface SuitIconProps {
  suit?: Suit;
  size?: number;
}

export function SuitIcon({ suit, size = 24 }: SuitIconProps) {
  if (!suit) {
    // ジョーカー（分類待ち）
    return (
      <span style={{ display: 'inline-flex', width: size, height: size, color: '#888', fontSize: size }}>
        🃏
      </span>
    );
  }
  const config = SUIT_CONFIG[suit];
  return (
    <span
      style={{
        display: 'inline-flex',
        width: size,
        height: size,
        color: config.color,
      }}
      dangerouslySetInnerHTML={{ __html: SUIT_ICONS[suit] }}
    />
  );
}
