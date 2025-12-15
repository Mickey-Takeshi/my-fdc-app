/**
 * app/_components/sync/SyncButton.tsx
 *
 * Phase 14: タスク同期ボタン
 */

'use client';

import { useState } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';

interface SyncButtonProps {
  workspaceId: string;
  onSyncComplete?: () => void;
}

export function SyncButton({ workspaceId, onSyncComplete }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch('/api/google/tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await response.json();

      if (data.success) {
        setResult('success');
        onSyncComplete?.();
      } else {
        setResult('error');
        console.error('Sync failed:', data.errors);
      }
    } catch (err) {
      console.error('Sync error:', err);
      setResult('error');
    } finally {
      setSyncing(false);
      // 3秒後に結果表示をクリア
      setTimeout(() => setResult(null), 3000);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 500,
        color: result === 'error' ? 'var(--danger)' : 'var(--primary)',
        background: 'transparent',
        border: `1px solid ${result === 'error' ? 'var(--danger)' : 'var(--primary)'}`,
        borderRadius: '6px',
        cursor: syncing ? 'not-allowed' : 'pointer',
        opacity: syncing ? 0.7 : 1,
      }}
    >
      {syncing ? (
        <>
          <RefreshCw size={16} className="animate-spin" />
          同期中...
        </>
      ) : result === 'success' ? (
        <>
          <Check size={16} />
          同期完了
        </>
      ) : result === 'error' ? (
        <>
          <AlertCircle size={16} />
          同期エラー
        </>
      ) : (
        <>
          <RefreshCw size={16} />
          Google Tasks と同期
        </>
      )}
    </button>
  );
}
