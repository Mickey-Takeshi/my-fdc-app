'use client';

/**
 * app/(app)/admin/_components/InvitationsSection.tsx
 *
 * 招待管理（Phase 18）
 */

import { useState } from 'react';
import { Send, Mail, Clock } from 'lucide-react';
import type { Invitation } from '@/lib/types/admin';

interface InvitationsSectionProps {
  invitations: Invitation[];
  onInvite: (email: string, role: 'ADMIN' | 'MEMBER') => Promise<boolean>;
}

export default function InvitationsSection({
  invitations,
  onInvite,
}: InvitationsSectionProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    const ok = await onInvite(email.trim(), role);
    if (ok) setEmail('');
    setSending(false);
  };

  const pendingInvitations = invitations.filter((inv) => !inv.acceptedAt);

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">
        <Mail size={16} /> 招待
      </h3>

      {/* 招待フォーム */}
      <form className="admin-invite-form" onSubmit={handleSubmit}>
        <input
          className="form-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          style={{ flex: 1 }}
        />
        <select
          className="form-input"
          value={role}
          onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MEMBER')}
          style={{ width: 'auto' }}
        >
          <option value="MEMBER">MEMBER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button
          type="submit"
          className="btn btn-primary btn-small"
          disabled={sending || !email.trim()}
        >
          <Send size={14} /> {sending ? '...' : '招待'}
        </button>
      </form>

      {/* 保留中の招待 */}
      {pendingInvitations.length > 0 && (
        <div className="admin-invitations-list">
          <h4 className="admin-subsection-title">
            <Clock size={14} /> 保留中 ({pendingInvitations.length})
          </h4>
          {pendingInvitations.map((inv) => (
            <div key={inv.id} className="admin-invitation-row">
              <span className="admin-invitation-email">{inv.email}</span>
              <span
                className="admin-role-badge"
                style={{
                  color: inv.role === 'ADMIN' ? '#2563eb' : '#6b7280',
                  borderColor: inv.role === 'ADMIN' ? '#2563eb' : '#6b7280',
                }}
              >
                {inv.role}
              </span>
              <span className="admin-invitation-expires">
                {new Date(inv.expiresAt).toLocaleDateString('ja-JP')} まで
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
