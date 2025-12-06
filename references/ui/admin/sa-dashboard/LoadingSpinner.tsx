/**
 * app/_components/admin/sa-dashboard/LoadingSpinner.tsx
 *
 * Phase 13 WS-E: SADashboardから分割
 * 共通ローディングスピナー
 */

'use client';

import { RefreshCw } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <RefreshCw
          size={48}
          style={{
            animation: 'spin 1s linear infinite',
            color: 'var(--loading)',
          }}
        />
        <p style={{ marginTop: '16px', color: 'var(--text-medium)' }}>
          読み込み中...
        </p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
