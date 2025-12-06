/**
 * app/_components/todo/GoogleSyncButton.tsx
 *
 * Phase 10-E-4: Google Tasks 同期ボタン
 *
 * 【機能】
 * - Google Tasks との手動同期
 * - 同期ステータス表示
 * - エラー時のリトライ
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  RefreshCw,
  Cloud,
  CloudOff,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { Task } from '@/lib/types/todo';

// ========================================
// 型定義
// ========================================

interface SyncStatus {
  enabled: boolean;
  lastSyncedAt: string | null;
  scopes: string[];
  tokenExpired: boolean;
}

interface SyncResult {
  success: boolean;
  synced: number;
  conflicts: number;
  errors: number;
  conflictDetails?: Array<{
    taskId: string;
    localVersion: Partial<Task>;
    remoteVersion: Partial<Task>;
  }>;
  errorDetails?: Array<{
    taskId: string;
    error: string;
  }>;
}

interface GoogleSyncButtonProps {
  tasks: Task[];
  onSyncComplete?: (result: SyncResult) => void;
  compact?: boolean;
}

type SyncState = 'idle' | 'syncing' | 'success' | 'error' | 'disconnected';

// ========================================
// ユーティリティ
// ========================================

function formatLastSync(isoString: string | null): string {
  if (!isoString) return '未同期';

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'たった今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;

  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });
}

// ========================================
// メインコンポーネント
// ========================================

export function GoogleSyncButton({
  tasks,
  onSyncComplete,
  compact = false,
}: GoogleSyncButtonProps) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [operationalState, setOperationalState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const initialFetchDone = useRef(false);

  // 派生状態: statusとoperationalStateからsyncStateを計算
  const syncState: SyncState = useMemo(() => {
    if (status && !status.enabled) {
      return 'disconnected';
    }
    return operationalState;
  }, [status, operationalState]);

  // 同期ステータス取得
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/google/sync');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('[GoogleSyncButton] Failed to fetch status:', err);
    }
  }, []);

  // 初回読み込み - AbortControllerを使ってクリーンアップを提供
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch('/api/google/sync', { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          if (!controller.signal.aborted) {
            setStatus(data);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('[GoogleSyncButton] Failed to fetch status:', err);
        }
      }
    })();

    return () => controller.abort();
  }, []);

  // 同期実行
  const handleSync = useCallback(async () => {
    if (syncState === 'syncing') return;
    if (!status?.enabled) return;

    setOperationalState('syncing');
    setLastResult(null);

    try {
      const response = await fetch('/api/google/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks }),
      });

      const result: SyncResult = await response.json();

      if (response.ok && result.success) {
        setOperationalState('success');
        setLastResult(result);
        onSyncComplete?.(result);

        // 3秒後に idle に戻す
        setTimeout(() => {
          setOperationalState('idle');
          fetchStatus(); // ステータス更新
        }, 3000);
      } else {
        setOperationalState('error');
        setLastResult(result);

        // 5秒後に idle に戻す
        setTimeout(() => {
          setOperationalState('idle');
        }, 5000);
      }
    } catch (err) {
      console.error('[GoogleSyncButton] Sync failed:', err);
      setOperationalState('error');
      setLastResult({
        success: false,
        synced: 0,
        conflicts: 0,
        errors: 1,
        errorDetails: [{ taskId: 'global', error: '同期に失敗しました' }],
      });

      setTimeout(() => {
        setOperationalState('idle');
      }, 5000);
    }
  }, [tasks, status, syncState, onSyncComplete, fetchStatus]);

  // アイコンとスタイル
  const getStateStyles = () => {
    switch (syncState) {
      case 'syncing':
        return {
          icon: <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />,
          bg: 'var(--primary-light)',
          color: 'var(--primary)',
          text: '同期中...',
        };
      case 'success':
        return {
          icon: <Check size={16} />,
          bg: '#e8f5e9',
          color: '#2e7d32',
          text: `${lastResult?.synced || 0}件同期`,
        };
      case 'error':
        return {
          icon: <AlertTriangle size={16} />,
          bg: '#ffebee',
          color: '#c62828',
          text: 'エラー',
        };
      case 'disconnected':
        return {
          icon: <CloudOff size={16} />,
          bg: '#f5f5f5',
          color: 'var(--text-light)',
          text: '未連携',
        };
      default:
        return {
          icon: <Cloud size={16} />,
          bg: 'white',
          color: 'var(--text-dark)',
          text: formatLastSync(status?.lastSyncedAt || null),
        };
    }
  };

  const styles = getStateStyles();

  // 未連携の場合は表示のみ
  if (syncState === 'disconnected') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: styles.bg,
          borderRadius: '6px',
          fontSize: '12px',
          color: styles.color,
        }}
        title="設定 > Google連携から接続してください"
      >
        {styles.icon}
        {!compact && <span>{styles.text}</span>}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleSync}
        disabled={syncState === 'syncing'}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: compact ? '6px' : '6px 12px',
          background: styles.bg,
          border: '1px solid var(--border)',
          borderRadius: '6px',
          cursor: syncState === 'syncing' ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          color: styles.color,
          transition: 'all 0.2s',
        }}
        title={status?.tokenExpired ? 'トークンの有効期限切れ。再連携が必要です。' : undefined}
      >
        {styles.icon}
        {!compact && <span>{styles.text}</span>}
      </button>

      {/* ツールチップ */}
      {showTooltip && lastResult && syncState !== 'syncing' && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            padding: '8px 12px',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <div style={{ marginBottom: '4px', fontWeight: 600 }}>
            最終同期結果
          </div>
          <div>同期済み: {lastResult.synced}件</div>
          {lastResult.conflicts > 0 && (
            <div style={{ color: '#f57c00' }}>
              競合: {lastResult.conflicts}件
            </div>
          )}
          {lastResult.errors > 0 && (
            <div style={{ color: '#c62828' }}>
              エラー: {lastResult.errors}件
            </div>
          )}
        </div>
      )}

      {/* エラー詳細（エラー時のみ） */}
      {syncState === 'error' && lastResult?.errorDetails && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            padding: '8px 12px',
            background: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '250px',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontWeight: 600, color: '#c62828' }}>
              同期エラー
            </span>
            <button
              onClick={() => setOperationalState('idle')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          </div>
          {lastResult.errorDetails.slice(0, 3).map((err, i) => (
            <div key={i} style={{ color: '#c62828' }}>
              {err.error}
            </div>
          ))}
          {lastResult.errorDetails.length > 3 && (
            <div style={{ color: 'var(--text-light)', marginTop: '4px' }}>
              他{lastResult.errorDetails.length - 3}件
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default GoogleSyncButton;
