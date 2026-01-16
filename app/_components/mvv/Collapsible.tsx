/**
 * app/_components/mvv/Collapsible.tsx
 *
 * Phase 17: 折り畳みコンポーネント
 */

'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  headerColor?: string;
}

export function Collapsible({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
  headerColor = 'rgba(255, 255, 255, 0.1)',
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* ヘッダー */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '16px 20px',
          background: headerColor,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left',
        }}
      >
        {isOpen ? (
          <ChevronDown size={20} color="rgba(255, 255, 255, 0.7)" />
        ) : (
          <ChevronRight size={20} color="rgba(255, 255, 255, 0.7)" />
        )}
        {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
              {subtitle}
            </div>
          )}
        </div>
      </button>

      {/* コンテンツ */}
      {isOpen && (
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
