'use client';

/**
 * app/(app)/tasks/error.tsx
 * Error boundary for tasks page - captures and displays actual errors
 */

import { useEffect } from 'react';

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Tasks page error:', error);
  }, [error]);

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: 'red', marginBottom: '16px' }}>Tasks Page Error</h2>
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
        {'\n\n'}
        {error.stack}
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
          background: '#5b5fc7',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}
