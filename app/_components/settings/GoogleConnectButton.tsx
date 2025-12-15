/**
 * app/_components/settings/GoogleConnectButton.tsx
 *
 * Phase 12: Google 連携ボタン
 */

'use client';

import { useState, useEffect } from 'react';

interface GoogleStatus {
  connected: boolean;
  scopes: string[];
  expiresAt?: string;
  isExpired?: boolean;
  hasRefreshToken?: boolean;
}

export function GoogleConnectButton() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/google/status');
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch Google status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // OAuth 認証ページへリダイレクト
    window.location.href = '/api/google/connect';
  };

  const handleDisconnect = async () => {
    if (!confirm('Google連携を解除しますか？カレンダー・タスク同期が停止します。')) {
      return;
    }

    setDisconnecting(true);
    try {
      const res = await fetch('/api/google/disconnect', { method: 'POST' });
      if (res.ok) {
        setStatus({ connected: false, scopes: [] });
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '16px', color: 'var(--text-light)' }}>
        読み込み中...
      </div>
    );
  }

  const hasCalendarScope = status?.scopes?.some(s => s.includes('calendar'));
  const hasTasksScope = status?.scopes?.some(s => s.includes('tasks'));

  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        backgroundColor: 'var(--card-bg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        {/* Google アイコン */}
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Google 連携</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-light)' }}>
            カレンダーとタスクを同期
          </p>
        </div>
        {status?.connected ? (
          <span
            style={{
              padding: '4px 8px',
              backgroundColor: 'var(--success)',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            連携中
          </span>
        ) : (
          <span
            style={{
              padding: '4px 8px',
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-light)',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            未連携
          </span>
        )}
      </div>

      {status?.connected && (
        <div style={{ marginBottom: '12px', fontSize: '13px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '2px 8px',
                backgroundColor: hasCalendarScope ? '#dcfce7' : '#fee2e2',
                color: hasCalendarScope ? '#166534' : '#991b1b',
                borderRadius: '4px',
              }}
            >
              {hasCalendarScope ? '✓' : '✗'} カレンダー
            </span>
            <span
              style={{
                padding: '2px 8px',
                backgroundColor: hasTasksScope ? '#dcfce7' : '#fee2e2',
                color: hasTasksScope ? '#166534' : '#991b1b',
                borderRadius: '4px',
              }}
            >
              {hasTasksScope ? '✓' : '✗'} タスク
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        {status?.connected ? (
          <>
            <button
              onClick={handleConnect}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              再認証
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'var(--danger)',
                color: 'white',
                cursor: disconnecting ? 'not-allowed' : 'pointer',
                opacity: disconnecting ? 0.5 : 1,
              }}
            >
              {disconnecting ? '解除中...' : '連携解除'}
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#4285F4',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Google アカウントを連携
          </button>
        )}
      </div>
    </div>
  );
}
