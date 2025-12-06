/**
 * app/_components/mvv/unified-mvv/CollapsibleSection.tsx
 *
 * Phase 14.35: コラップシブルセクションコンポーネント
 */

'use client';

import { useState, memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSection = memo(function CollapsibleSection({
  title,
  icon,
  color,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
          borderLeft: `5px solid ${color}`,
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color }}>{icon}</span>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color }}>{title}</h2>
        </div>
        <span style={{ color: '#666' }}>
          {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </span>
      </div>
      {isOpen && (
        <div
          style={{
            border: `1px solid ${color}30`,
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            padding: '20px',
            background: 'white',
            overflowX: 'auto',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
});
