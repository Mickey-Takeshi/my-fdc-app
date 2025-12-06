/**
 * app/_components/brand/components/SectionCard.tsx
 * セクションカードコンポーネント
 */

'use client';

import { Edit2, X } from 'lucide-react';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onEdit?: () => void;
  isEditing?: boolean;
}

export function SectionCard({
  title,
  icon,
  children,
  onEdit,
  isEditing,
}: SectionCardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'var(--text-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: 0,
          }}
        >
          {icon}
          {title}
        </h3>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              background: isEditing ? 'var(--error)' : 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {isEditing ? <X size={14} /> : <Edit2 size={14} />}
            {isEditing ? '閉じる' : '編集'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
