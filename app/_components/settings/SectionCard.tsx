/**
 * app/_components/settings/SectionCard.tsx
 *
 * 設定セクションの共通カードコンポーネント
 */

'use client';

import React from 'react';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  description?: string;
}

export function SectionCard({ title, icon, children, description }: SectionCardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: description ? '8px' : '20px',
        }}
      >
        {icon}
        <h3
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-dark, #1f2937)',
          }}
        >
          {title}
        </h3>
      </div>
      {description && (
        <p
          style={{
            margin: '0 0 20px',
            fontSize: '14px',
            color: 'var(--text-light, #9ca3af)',
          }}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

export default SectionCard;
