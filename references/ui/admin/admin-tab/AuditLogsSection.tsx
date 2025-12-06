'use client';

import { memo, CSSProperties } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import type { AuditLog } from '@/lib/hooks/useAdminViewModel';
import { ACTION_LABELS } from '@/lib/hooks/useAdminViewModel';
import { VirtualizedList } from '@/lib/components/VirtualizedList';

interface AuditLogsSectionProps {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}

/**
 * 監査ログセクション
 */
export const AuditLogsSection = memo(function AuditLogsSection({
  logs,
  loading,
  error,
  onRefresh,
}: AuditLogsSectionProps) {
  return (
    <div
      className="settings-section"
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div
        className="settings-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={28} style={{ color: 'var(--primary)' }} />
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-dark)',
            }}
          >
            監査ログ
          </h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'var(--bg-gray)',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            color: 'var(--text-dark)',
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          更新
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '16px', color: 'var(--text-medium)' }}>
            読み込み中...
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '16px', color: 'var(--text-medium)' }}>
            監査ログはまだありません。
          </div>
        </div>
      ) : (
        <VirtualizedList
          items={logs}
          height={600}
          itemHeight={100}
          virtualizationThreshold={30}
          renderItem={(log: AuditLog, _index: number, _style: CSSProperties) => {
            const actionLabel = ACTION_LABELS[log.action] || log.action;
            const timestamp = new Date(log.createdAt).toLocaleString('ja-JP');

            return (
              <div
                key={log.id}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  height: '100px',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-medium)',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  {(log.userName || log.userEmail).charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--text-dark)',
                      }}
                    >
                      {log.userName || log.userEmail}
                    </span>
                    <span
                      style={{
                        color: 'var(--text-medium)',
                        fontSize: '14px',
                      }}
                    >
                      •
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        background: 'var(--primary-alpha-10)',
                        color: 'var(--primary)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {actionLabel}
                    </span>
                  </div>
                  {log.details && (
                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-medium)',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {JSON.stringify(log.details, null, 2).substring(0, 100)}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-light)',
                    }}
                  >
                    {timestamp}
                  </div>
                </div>
              </div>
            );
          }}
        />
      )}
    </div>
  );
});
