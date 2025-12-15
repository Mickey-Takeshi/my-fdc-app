/**
 * app/_components/admin/InvitationsSection.tsx
 *
 * Phase 18: 招待管理セクション
 */

'use client';

import { useState } from 'react';
import { Copy, X, Clock, Check } from 'lucide-react';
import { useAdmin } from '@/lib/contexts/AdminContext';
import { RoleBadge } from './RoleBadge';
import { InviteForm } from './InviteForm';
import { WorkspaceRole } from '@/lib/types/workspace';

export function InvitationsSection() {
  const { invitations, cancelInvitation, getInviteUrl } = useAdmin();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleCopy = async (token: string, id: string) => {
    const url = getInviteUrl(token);
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancel = async (invitationId: string) => {
    if (!confirm('この招待をキャンセルしますか？')) return;
    setCancelling(invitationId);
    await cancelInvitation(invitationId);
    setCancelling(null);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const formatExpiry = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '期限切れ';
    if (diffDays === 0) return '今日まで';
    if (diffDays === 1) return '明日まで';
    return `${diffDays}日後まで`;
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
        メンバーを招待
      </h3>

      <InviteForm />

      {invitations.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 500, color: 'var(--text-light)' }}>
            保留中の招待 ({invitations.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'var(--bg)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  opacity: isExpired(invitation.expiresAt) ? 0.5 : 1,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{invitation.email}</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--text-light)',
                      marginTop: '4px',
                    }}
                  >
                    <RoleBadge role={invitation.role as WorkspaceRole} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {formatExpiry(invitation.expiresAt)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleCopy(invitation.token, invitation.id)}
                    disabled={isExpired(invitation.expiresAt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      fontSize: '13px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: copiedId === invitation.id ? 'var(--success)' : 'var(--text)',
                    }}
                  >
                    {copiedId === invitation.id ? (
                      <>
                        <Check size={14} />
                        コピー済み
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        URLをコピー
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCancel(invitation.id)}
                    disabled={cancelling === invitation.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: 'var(--danger)',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
