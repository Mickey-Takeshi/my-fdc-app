'use client';

/**
 * app/(app)/admin/page.tsx
 *
 * 管理者ページ（Phase 18-19）
 * - Workspace Admin タブ（メンバー管理、招待、監査ログ）
 * - Super Admin タブ（SA のみ表示）
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { WorkspaceMemberWithUser, WorkspaceRole } from '@/lib/types/workspace';
import type { Invitation, AuditLog } from '@/lib/types/admin';
import MembersSection from './_components/MembersSection';
import InvitationsSection from './_components/InvitationsSection';
import AuditLogsSection from './_components/AuditLogsSection';
import SADashboard from './_components/SADashboard';

type AdminTab = 'workspace' | 'super';

export default function AdminPage() {
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('workspace');
  const [members, setMembers] = useState<WorkspaceMemberWithUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSA, setIsSA] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    setError('');

    try {
      const [membersRes, invitesRes, logsRes] = await Promise.all([
        fetch(`/api/workspaces/${currentWorkspace.id}/members`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`/api/admin/invitations?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`/api/admin/audit-logs?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members ?? []);
      } else if (membersRes.status === 403) {
        setError('管理者権限がありません');
        setLoading(false);
        return;
      }

      if (invitesRes.ok) {
        const data = await invitesRes.json();
        setInvitations(data.invitations ?? []);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setAuditLogs(data.logs ?? []);
      }

      // SA チェック（メトリクスAPIへのアクセスで判定）
      const saRes = await fetch('/api/admin/metrics', {
        headers: { 'Content-Type': 'application/json' },
      });
      setIsSA(saRes.ok);
    } catch {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace) fetchData();
  }, [currentWorkspace, fetchData]);

  const handleRoleChange = async (
    userId: string,
    newRole: WorkspaceRole
  ): Promise<boolean> => {
    if (!currentWorkspace) return false;
    try {
      const res = await fetch(
        `/api/workspaces/${currentWorkspace.id}/members/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.user_id === userId ? { ...m, role: newRole } : m
          )
        );
        fetchData(); // refresh audit logs
        return true;
      }
      const json = await res.json();
      setError(json.error || 'ロール変更に失敗しました');
      return false;
    } catch {
      setError('ネットワークエラー');
      return false;
    }
  };

  const handleRemoveMember = async (userId: string): Promise<boolean> => {
    if (!currentWorkspace) return false;
    if (!window.confirm('このメンバーを削除しますか？')) return false;

    try {
      const res = await fetch(
        `/api/workspaces/${currentWorkspace.id}/members/${userId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.user_id !== userId));
        fetchData();
        return true;
      }
      const json = await res.json();
      setError(json.error || 'メンバー削除に失敗しました');
      return false;
    } catch {
      setError('ネットワークエラー');
      return false;
    }
  };

  const handleInvite = async (
    email: string,
    role: 'ADMIN' | 'MEMBER'
  ): Promise<boolean> => {
    if (!currentWorkspace) return false;
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          email,
          role,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setInvitations((prev) => [json.invitation, ...prev]);
        fetchData();
        return true;
      }
      setError(json.error || '招待に失敗しました');
      return false;
    } catch {
      setError('ネットワークエラー');
      return false;
    }
  };

  if (wsLoading || loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '8px' }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* タブ切替 */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'workspace' ? 'active' : ''}`}
          onClick={() => setActiveTab('workspace')}
        >
          <Shield size={14} /> Workspace Admin
        </button>
        {isSA && (
          <button
            className={`admin-tab ${activeTab === 'super' ? 'active' : ''}`}
            onClick={() => setActiveTab('super')}
          >
            <Shield size={14} /> Super Admin
          </button>
        )}
      </div>

      {/* エラー */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {error}
            <button
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              x
            </button>
          </div>
        </div>
      )}

      {/* コンテンツ */}
      {activeTab === 'workspace' ? (
        <div className="admin-content">
          <MembersSection
            members={members}
            currentUserId={user?.id || ''}
            onRoleChange={handleRoleChange}
            onRemove={handleRemoveMember}
          />
          <InvitationsSection
            invitations={invitations}
            onInvite={handleInvite}
          />
          <AuditLogsSection logs={auditLogs} />
        </div>
      ) : (
        <SADashboard />
      )}
    </div>
  );
}
