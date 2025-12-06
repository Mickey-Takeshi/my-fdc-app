/**
 * app/_components/settings/settings-tab/GoogleTasksSection.tsx
 * Google Tasks 連携セクション
 */

import { RefreshCw, Link, Unlink, CheckCircle, AlertCircle } from 'lucide-react';
import { GoogleSyncStatus } from '@/lib/hooks/useSettingsViewModel';

interface GoogleTasksSectionProps {
  syncStatus: GoogleSyncStatus | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function GoogleTasksSection({
  syncStatus,
  loading,
  error,
  success,
  onConnect,
  onDisconnect,
}: GoogleTasksSectionProps) {
  const isConnected = syncStatus?.enabled ?? false;

  return (
    <>
      {/* エラーメッセージ */}
      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* 成功メッセージ */}
      {success && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* 連携状態 */}
      <div
        style={{
          padding: '16px',
          backgroundColor: isConnected ? 'var(--primary-alpha-10)' : '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: isConnected ? '12px' : '0',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: isConnected ? 'var(--primary)' : '#9e9e9e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isConnected ? (
              <CheckCircle size={20} color="white" />
            ) : (
              <Link size={20} color="white" />
            )}
          </div>
          <div>
            <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
              {isConnected ? 'Google Tasks 連携中' : 'Google Tasks 未連携'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
              {isConnected
                ? 'タスクは Google Tasks と同期されます'
                : '連携すると FDC のタスクが Google Tasks に同期されます'}
            </div>
          </div>
        </div>

        {/* 連携情報 */}
        {isConnected && syncStatus && (
          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
            {syncStatus.lastSyncedAt && (
              <div>
                最終同期: {new Date(syncStatus.lastSyncedAt).toLocaleString('ja-JP')}
              </div>
            )}
            {syncStatus.tokenExpired && (
              <div style={{ color: '#f44336', marginTop: '4px' }}>
                <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> トークンの有効期限が切れています。再連携してください。
              </div>
            )}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      {isConnected ? (
        <button
          onClick={onDisconnect}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#B91C1C',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Unlink size={16} />
          )}
          {loading ? '処理中...' : '連携を解除'}
        </button>
      ) : (
        <button
          onClick={onConnect}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Link size={16} />
          )}
          {loading ? '接続中...' : 'Google Tasks と連携'}
        </button>
      )}

      <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '12px' }}>
        ※ Google Tasks API と Google Calendar API（読み取り専用）へのアクセスを許可します
      </p>
    </>
  );
}
