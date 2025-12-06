'use client';

import { memo } from 'react';
import { XCircle } from 'lucide-react';

/**
 * アクセス拒否メッセージ
 */
export const AccessDenied = memo(function AccessDenied() {
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
        <XCircle
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
          アクセス権限がありません
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: '16px',
            color: 'var(--text-medium)',
            lineHeight: 1.6,
          }}
        >
          この機能は管理者のみ利用可能です。
        </p>
      </div>
    </div>
  );
});
