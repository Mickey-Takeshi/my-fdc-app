/**
 * インポート結果表示コンポーネント
 */

'use client';

import { memo } from 'react';
import type { ImportResult } from './types';

interface ImportResultDisplayProps {
  result: ImportResult | null;
}

export const ImportResultDisplay = memo(function ImportResultDisplay({ result }: ImportResultDisplayProps) {
  if (!result) return null;

  return (
    <div
      style={{
        padding: '12px 16px',
        marginBottom: '16px',
        borderRadius: '8px',
        background:
          result.type === 'success'
            ? 'rgba(16, 185, 129, 0.1)'
            : result.type === 'warning'
            ? 'rgba(245, 158, 11, 0.1)'
            : 'rgba(239, 68, 68, 0.1)',
        color:
          result.type === 'success'
            ? '#059669'
            : result.type === 'warning'
            ? '#D97706'
            : '#DC2626',
        fontSize: '14px',
      }}
    >
      {result.message}
    </div>
  );
});
