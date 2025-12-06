/**
 * app/_components/todo/elastic-habits-panel/SuitIcon.tsx
 *
 * SVGスートアイコン
 */

'use client';

import React from 'react';
import { SUIT_CONFIG, SUIT_ICONS } from '@/lib/types/todo';

interface SuitIconProps {
  suit: 'heart' | 'club';
  size?: number;
}

export function SuitIcon({ suit, size = 16 }: SuitIconProps) {
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
