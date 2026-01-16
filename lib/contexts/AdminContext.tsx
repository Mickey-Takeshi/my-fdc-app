/**
 * lib/contexts/AdminContext.tsx
 *
 * Phase 18: ワークスペース管理者機能の状態管理
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useWorkspace } from './WorkspaceContext';
import {
  InvitationWithCreator,
  AuditLogWithUser,
  CreateInvitationRequest,
} from '@/lib/types/admin';
import { WorkspaceRole } from '@/lib/types/workspace';

interface AdminContextValue {
  // 状態
  invitations: InvitationWithCreator[];
  auditLogs: AuditLogWithUser[];
  auditLogsTotal: number;
  loading: boolean;
  error: string | null;

  // 招待操作
  sendInvitation: (request: CreateInvitationRequest) => Promise<{ success: boolean; error?: string }>;
  cancelInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  getInviteUrl: (token: string) => string;

  // メンバー操作
  changeMemberRole: (memberId: string, newRole: WorkspaceRole) => Promise<{ success: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;

  // 監査ログ
  loadMoreAuditLogs: () => Promise<void>;

  // 再読み込み
  reloadInvitations: () => Promise<void>;
  reloadAuditLogs: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { workspace, role, reloadMembers } = useWorkspace();
  const [invitations, setInvitations] = useState<InvitationWithCreator[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogWithUser[]>([]);
  const [auditLogsTotal, setAuditLogsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = workspace?.id;
  const isAdmin = role === 'OWNER' || role === 'ADMIN';

  // 招待一覧を読み込み
  const reloadInvitations = useCallback(async () => {
    if (!workspaceId || !isAdmin) return;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations);
      }
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  }, [workspaceId, isAdmin]);

  // 監査ログを読み込み
  const reloadAuditLogs = useCallback(async () => {
    if (!workspaceId || !isAdmin) return;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/audit-logs?limit=50&offset=0`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs);
        setAuditLogsTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  }, [workspaceId, isAdmin]);

  // 初期読み込み
  useEffect(() => {
    if (!workspaceId || !isAdmin) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      await Promise.all([reloadInvitations(), reloadAuditLogs()]);

      setLoading(false);
    };

    loadData();
  }, [workspaceId, isAdmin, reloadInvitations, reloadAuditLogs]);

  // 招待を送信
  const sendInvitation = useCallback(
    async (request: CreateInvitationRequest) => {
      if (!workspaceId) {
        return { success: false, error: 'ワークスペースが選択されていません' };
      }

      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error };
        }

        await reloadInvitations();
        return { success: true };
      } catch (err) {
        console.error('Failed to send invitation:', err);
        return { success: false, error: '招待の送信に失敗しました' };
      }
    },
    [workspaceId, reloadInvitations]
  );

  // 招待をキャンセル
  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      if (!workspaceId) {
        return { success: false, error: 'ワークスペースが選択されていません' };
      }

      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/invitations/${invitationId}`,
          { method: 'DELETE' }
        );

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error };
        }

        await reloadInvitations();
        return { success: true };
      } catch (err) {
        console.error('Failed to cancel invitation:', err);
        return { success: false, error: '招待のキャンセルに失敗しました' };
      }
    },
    [workspaceId, reloadInvitations]
  );

  // 招待 URL を取得
  const getInviteUrl = useCallback((token: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/invite/${token}`;
  }, []);

  // メンバーのロールを変更
  const changeMemberRole = useCallback(
    async (memberId: string, newRole: WorkspaceRole) => {
      if (!workspaceId) {
        return { success: false, error: 'ワークスペースが選択されていません' };
      }

      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/members/${memberId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error };
        }

        await reloadMembers();
        await reloadAuditLogs();
        return { success: true };
      } catch (err) {
        console.error('Failed to change role:', err);
        return { success: false, error: 'ロールの変更に失敗しました' };
      }
    },
    [workspaceId, reloadMembers, reloadAuditLogs]
  );

  // メンバーを削除
  const removeMember = useCallback(
    async (memberId: string) => {
      if (!workspaceId) {
        return { success: false, error: 'ワークスペースが選択されていません' };
      }

      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/members/${memberId}`,
          { method: 'DELETE' }
        );

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error };
        }

        await reloadMembers();
        await reloadAuditLogs();
        return { success: true };
      } catch (err) {
        console.error('Failed to remove member:', err);
        return { success: false, error: 'メンバーの削除に失敗しました' };
      }
    },
    [workspaceId, reloadMembers, reloadAuditLogs]
  );

  // 監査ログを追加読み込み
  const loadMoreAuditLogs = useCallback(async () => {
    if (!workspaceId || !isAdmin) return;

    try {
      const offset = auditLogs.length;
      const response = await fetch(
        `/api/workspaces/${workspaceId}/audit-logs?limit=50&offset=${offset}`
      );
      if (response.ok) {
        const data = await response.json();
        setAuditLogs((prev) => [...prev, ...data.logs]);
        setAuditLogsTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to load more audit logs:', err);
    }
  }, [workspaceId, isAdmin, auditLogs.length]);

  return (
    <AdminContext.Provider
      value={{
        invitations,
        auditLogs,
        auditLogsTotal,
        loading,
        error,
        sendInvitation,
        cancelInvitation,
        getInviteUrl,
        changeMemberRole,
        removeMember,
        loadMoreAuditLogs,
        reloadInvitations,
        reloadAuditLogs,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
