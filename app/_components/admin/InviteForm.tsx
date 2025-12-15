/**
 * app/_components/admin/InviteForm.tsx
 *
 * Phase 18: 招待フォームコンポーネント
 */

'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useAdmin } from '@/lib/contexts/AdminContext';
import { WorkspaceRole } from '@/lib/types/workspace';

export function InviteForm() {
  const { sendInvitation } = useAdmin();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<WorkspaceRole, 'OWNER'>>('MEMBER');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSending(true);

    const result = await sendInvitation({ email, role });

    if (result.success) {
      setSuccess(true);
      setEmail('');
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || '招待の送信に失敗しました');
    }

    setSending(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          required
          style={{
            flex: '1 1 200px',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
          }}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Exclude<WorkspaceRole, 'OWNER'>)}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
          }}
        >
          <option value="MEMBER">メンバー</option>
          <option value="ADMIN">管理者</option>
        </select>

        <button
          type="submit"
          disabled={sending || !email}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#fff',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: '6px',
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: sending ? 0.7 : 1,
          }}
        >
          <Send size={16} />
          {sending ? '送信中...' : '招待を送信'}
        </button>
      </div>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '14px', marginTop: '8px' }}>
          {error}
        </p>
      )}

      {success && (
        <p style={{ color: 'var(--success)', fontSize: '14px', marginTop: '8px' }}>
          招待を送信しました
        </p>
      )}
    </form>
  );
}
