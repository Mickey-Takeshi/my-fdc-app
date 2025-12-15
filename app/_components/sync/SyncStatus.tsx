/**
 * app/_components/sync/SyncStatus.tsx
 *
 * Phase 14: 同期状態表示
 */

'use client';

import { useState, useEffect } from 'react';
import { Cloud, RefreshCw, Check, AlertTriangle } from 'lucide-react';

interface SyncStatusProps {
  workspaceId: string;
}

interface SyncStatusData {
  status: string;
  lastSyncAt: string | null;
  error: string | null;
  taskListName: string | null;
}

export function SyncStatus({ workspaceId }: SyncStatusProps) {
  const [data, setData] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    // 30秒ごとに更新
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/google/tasks/sync?workspaceId=${workspaceId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
        読み込み中...
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getStatusIcon = () => {
    switch (data.status) {
      case 'syncing':
        return <RefreshCw size={14} className="animate-spin" />;
      case 'synced':
        return <Check size={14} />;
      case 'error':
        return <AlertTriangle size={14} />;
      default:
        return <Cloud size={14} />;
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'syncing':
        return 'var(--primary)';
      case 'synced':
        return 'var(--success)';
      case 'error':
        return 'var(--danger)';
      default:
        return 'var(--text-light)';
    }
  };

  const formatLastSync = () => {
    if (!data.lastSyncAt) return '未同期';
    const date = new Date(data.lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: getStatusColor(),
      }}
    >
      {getStatusIcon()}
      <span>
        {data.status === 'syncing' ? '同期中...' : formatLastSync()}
      </span>
      {data.taskListName && (
        <span style={{ color: 'var(--text-muted)' }}>
          ({data.taskListName})
        </span>
      )}
    </div>
  );
}
