'use client';

import { memo } from 'react';
import { Copy, Check, Trash2 } from 'lucide-react';

// 招待リンクの型定義
export interface Invitation {
  id: string;
  token: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  expiresAt: string;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  isExpired: boolean;
  createdAt: string;
  createdBy: {
    name: string | null;
    email: string;
  } | null;
  supervisorId: string | null;
  inviteUrl?: string;
}

interface InvitationsTableProps {
  invitations: Invitation[];
  copiedId: string | null;
  onCopyUrl: (invitation: Invitation) => void;
  onDeactivate: (invitationId: string) => void;
}

/**
 * 招待リンク一覧テーブル
 */
export const InvitationsTable = memo(function InvitationsTable({
  invitations,
  copiedId,
  onCopyUrl,
  onDeactivate,
}: InvitationsTableProps) {
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600 }}>ロール</th>
            <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600 }}>状態</th>
            <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600 }}>使用回数</th>
            <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600 }}>有効期限</th>
            <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600 }}>作成者</th>
            <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 600 }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => {
            const isUsable = inv.isActive && !inv.isExpired && (inv.maxUses === null || inv.useCount < inv.maxUses);

            return (
              <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 12px',
                      background: 'var(--primary-alpha-10)',
                      color: 'var(--primary)',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {inv.role}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {!inv.isActive ? (
                    <span style={{ color: '#9CA3AF', fontSize: '14px' }}>無効化済み</span>
                  ) : inv.isExpired ? (
                    <span style={{ color: '#EF4444', fontSize: '14px' }}>期限切れ</span>
                  ) : inv.maxUses !== null && inv.useCount >= inv.maxUses ? (
                    <span style={{ color: 'var(--primary)', fontSize: '14px' }}>上限到達</span>
                  ) : (
                    <span style={{ color: 'var(--primary)', fontSize: '14px' }}>有効</span>
                  )}
                </td>
                <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-medium)' }}>
                  {inv.useCount} / {inv.maxUses === null ? '∞' : inv.maxUses}
                </td>
                <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-medium)' }}>
                  {new Date(inv.expiresAt).toLocaleDateString('ja-JP')}
                </td>
                <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-medium)' }}>
                  {inv.createdBy?.name || inv.createdBy?.email || '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isUsable && (
                      <button
                        onClick={() => onCopyUrl(inv)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {copiedId === inv.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === inv.id ? 'コピー済み' : 'URLコピー'}
                      </button>
                    )}
                    {inv.isActive && (
                      <button
                        onClick={() => onDeactivate(inv.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          background: '#B91C1C',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        <Trash2 size={14} />
                        無効化
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
