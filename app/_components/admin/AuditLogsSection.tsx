/**
 * app/_components/admin/AuditLogsSection.tsx
 *
 * Phase 18: 監査ログセクション
 */

'use client';

import {
  Mail,
  UserPlus,
  UserMinus,
  Shield,
  Settings,
  XCircle,
} from 'lucide-react';
import { useAdmin } from '@/lib/contexts/AdminContext';
import { AuditAction } from '@/lib/types/admin';

const actionConfig: Record<
  AuditAction,
  { icon: React.ReactNode; label: string; color: string }
> = {
  invitation_sent: {
    icon: <Mail size={16} />,
    label: '招待を送信',
    color: 'var(--primary)',
  },
  invitation_accepted: {
    icon: <UserPlus size={16} />,
    label: '招待を承認',
    color: 'var(--success)',
  },
  invitation_cancelled: {
    icon: <XCircle size={16} />,
    label: '招待をキャンセル',
    color: 'var(--warning)',
  },
  member_role_changed: {
    icon: <Shield size={16} />,
    label: 'ロールを変更',
    color: 'var(--primary)',
  },
  member_removed: {
    icon: <UserMinus size={16} />,
    label: 'メンバーを削除',
    color: 'var(--danger)',
  },
  workspace_updated: {
    icon: <Settings size={16} />,
    label: 'ワークスペースを更新',
    color: 'var(--text-light)',
  },
};

export function AuditLogsSection() {
  const { auditLogs, auditLogsTotal, loadMoreAuditLogs } = useAdmin();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionDetails = (action: AuditAction, details: Record<string, unknown>) => {
    switch (action) {
      case 'invitation_sent':
        return `${details.email} を ${details.role} として招待`;
      case 'invitation_accepted':
        return `${details.email} が招待を承認`;
      case 'invitation_cancelled':
        return `${details.email} への招待をキャンセル`;
      case 'member_role_changed':
        return `${details.memberEmail} のロールを ${details.oldRole} から ${details.newRole} に変更`;
      case 'member_removed':
        return `${details.memberEmail} (${details.role}) を削除`;
      case 'workspace_updated':
        return 'ワークスペース設定を更新';
      default:
        return '';
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
        操作履歴
      </h3>

      {auditLogs.length === 0 ? (
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
          操作履歴はありません
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {auditLogs.map((log) => {
              const config = actionConfig[log.action as AuditAction];

              return (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg)',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: `${config.color}20`,
                      color: config.color,
                      flexShrink: 0,
                    }}
                  >
                    {config.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{config.label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                      {getActionDetails(log.action as AuditAction, log.details)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      実行者: {log.user?.name || log.user?.email || '不明'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {auditLogs.length < auditLogsTotal && (
            <button
              onClick={loadMoreAuditLogs}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                marginTop: '16px',
                fontSize: '14px',
                color: 'var(--primary)',
                background: 'transparent',
                border: '1px solid var(--primary)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              もっと見る ({auditLogsTotal - auditLogs.length} 件)
            </button>
          )}
        </>
      )}
    </div>
  );
}
