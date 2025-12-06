/**
 * app/_components/admin/sa-dashboard/AccessDenied.tsx
 *
 * Phase 13 WS-E: SADashboardから分割
 * アクセス拒否画面
 */

'use client';

import { AlertCircle } from 'lucide-react';

interface AccessDeniedProps {
  message: string;
  onBack: () => void;
}

export function AccessDenied({ message, onBack }: AccessDeniedProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '500px',
          padding: '48px',
        }}
      >
        <AlertCircle
          size={80}
          style={{
            margin: '0 auto 24px',
            color: '#F44336',
          }}
        />
        <h2
          style={{
            margin: '0 0 16px',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-dark)',
          }}
        >
          アクセス拒否
        </h2>
        <p
          style={{
            margin: '0 0 24px',
            fontSize: '16px',
            color: 'var(--text-medium)',
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
        <button
          onClick={onBack}
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ダッシュボードに戻る
        </button>
      </div>
    </div>
  );
}

export default AccessDenied;
