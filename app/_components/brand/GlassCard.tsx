/**
 * app/_components/brand/GlassCard.tsx
 *
 * Phase 15: Glass morphism カードコンポーネント
 */

'use client';

import { ReactNode, CSSProperties } from 'react';

interface GlassCardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, style, className, onClick }: GlassCardProps) {
  const baseStyle: CSSProperties = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    padding: '24px',
    transition: 'all 0.3s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  return (
    <div
      style={baseStyle}
      className={className}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </div>
  );
}
