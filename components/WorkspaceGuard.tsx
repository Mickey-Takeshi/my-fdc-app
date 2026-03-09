'use client';

/**
 * components/WorkspaceGuard.tsx
 *
 * ワークスペースのローディング/エラー/未作成状態を共通処理するガードコンポーネント
 * 各ページで wsLoading / error / !currentWorkspace を個別に書く代わりに使用
 */

import { type ReactNode } from 'react';
import { Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';

interface WorkspaceGuardProps {
  children: ReactNode;
}

export default function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const { currentWorkspace, loading, error, fetchWorkspaces } = useWorkspace();

  // ローディング中
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '8px' }}>読み込み中...</p>
      </div>
    );
  }

  // ワークスペース取得エラー
  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <AlertCircle size={48} style={{ color: 'var(--error)', marginBottom: '16px' }} />
        <p style={{ marginBottom: '8px', fontWeight: 600 }}>ワークスペースの読み込みに失敗しました</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '16px' }}>
          {error}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => fetchWorkspaces()}
        >
          <RefreshCw size={16} />
          再試行
        </button>
      </div>
    );
  }

  // ワークスペース未作成
  if (!currentWorkspace) {
    return (
      <div className="card">
        <div className="empty-state">
          <Loader size={64} className="empty-state-icon" />
          <p>ワークスペースがありません</p>
          <p style={{ fontSize: 14 }}>設定ページからワークスペースを作成してください</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
