'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Link2, RefreshCw, Plus } from 'lucide-react';
import type { WorkspaceMember } from '@/lib/hooks/useAdminViewModel';
import { InvitationCreateForm } from './InvitationCreateForm';
import { InvitationsTable, type Invitation } from './InvitationsTable';

interface InvitationsSectionProps {
  workspaceId: string | null;
  canManageMembers: boolean;
  members: WorkspaceMember[];
}

/**
 * 招待リンク管理セクション
 */
export const InvitationsSection = memo(function InvitationsSection({
  workspaceId,
  canManageMembers,
  members,
}: InvitationsSectionProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 新規作成フォーム
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createRole, setCreateRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER'>('MEMBER');
  const [createExpiresDays, setCreateExpiresDays] = useState(7);
  const [createMaxUses, setCreateMaxUses] = useState<number | null>(null);
  const [createSupervisorId, setCreateSupervisorId] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // 上司選択用のメンバーリスト（OWNER/ADMINを優先表示）
  const supervisorOptions = useMemo(() => {
    return [...members].sort((a, b) => {
      const roleOrder = { OWNER: 0, ADMIN: 1, MEMBER: 2 };
      return roleOrder[a.role] - roleOrder[b.role];
    });
  }, [members]);

  // 招待リンク一覧を取得
  const fetchInvitations = useCallback(async () => {
    if (!workspaceId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/invitations?workspaceId=${workspaceId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '招待リンクの取得に失敗しました');
      }
      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId && canManageMembers) {
      fetchInvitations();
    }
  }, [workspaceId, canManageMembers, fetchInvitations]);

  // 招待リンクを作成
  const handleCreate = async () => {
    if (!workspaceId) return;

    setCreateLoading(true);
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workspaceId,
          role: createRole,
          expiresInDays: createExpiresDays,
          maxUses: createMaxUses,
          supervisorId: createSupervisorId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '招待リンクの作成に失敗しました');
      }

      setShowCreateForm(false);
      setCreateRole('MEMBER');
      setCreateExpiresDays(7);
      setCreateMaxUses(null);
      setCreateSupervisorId(null);
      await fetchInvitations();
    } catch (err) {
      alert(err instanceof Error ? err.message : '作成に失敗しました');
    } finally {
      setCreateLoading(false);
    }
  };

  // 招待リンクを無効化
  const handleDeactivate = async (invitationId: string) => {
    if (!confirm('この招待リンクを無効化してもよろしいですか？')) return;

    try {
      const response = await fetch('/api/invitations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ invitationId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '無効化に失敗しました');
      }

      await fetchInvitations();
    } catch (err) {
      alert(err instanceof Error ? err.message : '無効化に失敗しました');
    }
  };

  // URLをコピー
  const handleCopyUrl = async (invitation: Invitation) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}/invite/${invitation.token}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invitation.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('コピーに失敗しました');
    }
  };

  if (!canManageMembers) {
    return null;
  }

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
          <Link2 size={28} style={{ color: 'var(--primary)' }} />
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-dark)',
            }}
          >
            招待リンク
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchInvitations}
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
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <Plus size={16} />
            新規作成
          </button>
        </div>
      </div>

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <InvitationCreateForm
          supervisorOptions={supervisorOptions}
          createRole={createRole}
          setCreateRole={setCreateRole}
          createExpiresDays={createExpiresDays}
          setCreateExpiresDays={setCreateExpiresDays}
          createMaxUses={createMaxUses}
          setCreateMaxUses={setCreateMaxUses}
          createSupervisorId={createSupervisorId}
          setCreateSupervisorId={setCreateSupervisorId}
          createLoading={createLoading}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

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
      ) : invitations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '16px', color: 'var(--text-medium)' }}>
            招待リンクがありません。「新規作成」ボタンで作成してください。
          </div>
        </div>
      ) : (
        <InvitationsTable
          invitations={invitations}
          copiedId={copiedId}
          onCopyUrl={handleCopyUrl}
          onDeactivate={handleDeactivate}
        />
      )}
    </div>
  );
});
