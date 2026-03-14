'use client';

/**
 * app/(app)/error.tsx
 * Shared error boundary for all authenticated pages
 */

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--error, red)', marginBottom: '16px' }}>
        エラーが発生しました
      </h2>
      <pre style={{
        background: '#f5f5f5',
        padding: '16px',
        borderRadius: '8px',
        overflow: 'auto',
        fontSize: '13px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}>
        {error.message}
      </pre>
      {error.digest && (
        <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
          Digest: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          marginTop: '16px',
          padding: '8px 16px',
          background: 'var(--primary, #5b5fc7)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        再試行
      </button>
    </div>
  );
}
