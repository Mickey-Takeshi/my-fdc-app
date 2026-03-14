'use client';

/**
 * app/(app)/tasks/_components/SyncButton.tsx
 *
 * Google Tasks 同期ボタン + ステータス表示（Phase 14）
 */

import { useState } from 'react';
import { RefreshCw, Check, AlertCircle, Cloud } from 'lucide-react';
import type { SyncResult, SyncStatus } from '@/lib/types/google-tasks';

interface SyncButtonProps {
  workspaceId: string;
  onSyncComplete?: () => void;
}

export default function SyncButton({ workspaceId, onSyncComplete }: SyncButtonProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncAt: null,
    status: 'idle',
  });
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    if (syncStatus.status === 'syncing') return;

    setSyncStatus({ lastSyncAt: syncStatus.lastSyncAt, status: 'syncing' });

    try {
      const res = await fetch(
        `/api/google/tasks/sync?workspace_id=${workspaceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!res.ok) {
        const json = await res.json();
        setSyncStatus({
          lastSyncAt: syncStatus.lastSyncAt,
          status: 'error',
          error: json.error || '同期に失敗しました',
        });
        return;
      }

      const data = await res.json();
      const result: SyncResult = data.result;

      setLastResult(result);
      setSyncStatus({
        lastSyncAt: result.lastSyncAt,
        status: result.errors.length > 0 ? 'error' : 'synced',
        error: result.errors.length > 0 ? result.errors[0] : undefined,
        syncedCount:
          result.createdInFdc +
          result.updatedInFdc +
          result.createdInGoogle +
          result.updatedInGoogle,
      });

      onSyncComplete?.();

      // 3秒後にステータスをリセット
      setTimeout(() => {
        setSyncStatus((prev) => ({
          ...prev,
          status: 'idle',
        }));
      }, 3000);
    } catch {
      setSyncStatus({
        lastSyncAt: syncStatus.lastSyncAt,
        status: 'error',
        error: 'ネットワークエラー',
      });
    }
  };

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    });
  };

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <RefreshCw size={14} className="sync-icon-spin" />;
      case 'synced':
        return <Check size={14} />;
      case 'error':
        return <AlertCircle size={14} />;
      default:
        return <Cloud size={14} />;
    }
  };

  const getStatusClass = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return 'sync-btn-syncing';
      case 'synced':
        return 'sync-btn-synced';
      case 'error':
        return 'sync-btn-error';
      default:
        return '';
    }
  };

  return (
    <div className="sync-container">
      <button
        className={`btn btn-outline sync-btn ${getStatusClass()}`}
        onClick={handleSync}
        disabled={syncStatus.status === 'syncing'}
        title={
          syncStatus.error ||
          (syncStatus.lastSyncAt
            ? `最終同期: ${formatLastSync(syncStatus.lastSyncAt)}`
            : 'Google Tasks と同期')
        }
      >
        {getStatusIcon()}
        <span>
          {syncStatus.status === 'syncing'
            ? '同期中...'
            : syncStatus.status === 'synced'
              ? '同期完了'
              : syncStatus.status === 'error'
                ? 'エラー'
                : 'Google同期'}
        </span>
      </button>

      {/* 同期結果の詳細表示 */}
      {lastResult && syncStatus.status === 'synced' && (
        <div className="sync-result-badge">
          {lastResult.createdInFdc + lastResult.updatedInFdc +
            lastResult.createdInGoogle + lastResult.updatedInGoogle > 0 ? (
            <span>
              {lastResult.createdInFdc > 0 && `+${lastResult.createdInFdc}取込 `}
              {lastResult.updatedInFdc > 0 && `${lastResult.updatedInFdc}更新 `}
              {lastResult.createdInGoogle > 0 && `+${lastResult.createdInGoogle}送信 `}
              {lastResult.updatedInGoogle > 0 && `${lastResult.updatedInGoogle}反映`}
            </span>
          ) : (
            <span>変更なし</span>
          )}
        </div>
      )}

      {syncStatus.lastSyncAt && syncStatus.status === 'idle' && (
        <span className="sync-last-time">
          最終: {formatLastSync(syncStatus.lastSyncAt)}
        </span>
      )}
    </div>
  );
}
