'use client';

/**
 * lib/hooks/useWorkspace.ts
 *
 * ワークスペース管理フック（Phase 5）
 * ワークスペースの CRUD、メンバー管理を提供
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  WorkspaceWithRole,
  WorkspaceMemberWithUser,
  WorkspaceRole,
} from '@/lib/types/workspace';

interface UseWorkspaceReturn {
  /** ユーザーが所属するワークスペース一覧 */
  workspaces: WorkspaceWithRole[];
  /** 現在選択中のワークスペース */
  currentWorkspace: WorkspaceWithRole | null;
  /** 現在のワークスペースのメンバー一覧 */
  members: WorkspaceMemberWithUser[];
  /** ローディング状態 */
  loading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** ワークスペース一覧を再取得 */
  fetchWorkspaces: () => Promise<void>;
  /** ワークスペースを選択 */
  selectWorkspace: (workspaceId: string) => void;
  /** ワークスペース作成 */
  createWorkspace: (name: string) => Promise<boolean>;
  /** ワークスペース名更新 */
  updateWorkspace: (id: string, name: string) => Promise<boolean>;
  /** ワークスペース削除 */
  deleteWorkspace: (id: string) => Promise<boolean>;
  /** メンバー一覧を取得 */
  fetchMembers: (workspaceId: string) => Promise<void>;
  /** メンバー追加 */
  addMember: (
    workspaceId: string,
    email: string,
    role: 'ADMIN' | 'MEMBER'
  ) => Promise<boolean>;
  /** メンバーロール変更 */
  updateMemberRole: (
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ) => Promise<boolean>;
  /** メンバー削除 */
  removeMember: (
    workspaceId: string,
    userId: string
  ) => Promise<boolean>;
}

async function fetchJSON<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      return { data: null, error: json.error || 'エラーが発生しました' };
    }
    return { data: json as T, error: null };
  } catch {
    return { data: null, error: 'ネットワークエラーが発生しました' };
  }
}

export function useWorkspace(): UseWorkspaceReturn {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [currentWorkspace, setCurrentWorkspace] =
    useState<WorkspaceWithRole | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** ワークスペース一覧を取得 */
  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchJSON<{
      workspaces: WorkspaceWithRole[];
    }>('/api/workspaces');

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    const wsList = data?.workspaces ?? [];
    setWorkspaces(wsList);

    // 現在のワークスペースが未選択なら最初のものを選択
    if (!currentWorkspace && wsList.length > 0) {
      setCurrentWorkspace(wsList[0]);
    }

    setLoading(false);
  }, [currentWorkspace]);

  /** ワークスペースを選択 */
  const selectWorkspace = useCallback(
    (workspaceId: string) => {
      const ws = workspaces.find((w) => w.id === workspaceId);
      if (ws) {
        setCurrentWorkspace(ws);
      }
    },
    [workspaces]
  );

  /** ワークスペース作成 */
  const createWorkspace = useCallback(async (name: string): Promise<boolean> => {
    setError(null);
    const { data, error: createError } = await fetchJSON<{
      workspace: WorkspaceWithRole;
    }>('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

    if (createError) {
      setError(createError);
      return false;
    }

    if (data?.workspace) {
      setWorkspaces((prev) => [...prev, data.workspace]);
      setCurrentWorkspace(data.workspace);
    }

    return true;
  }, []);

  /** ワークスペース名更新 */
  const updateWorkspace = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      setError(null);
      const { error: updateError } = await fetchJSON(
        `/api/workspaces/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ name }),
        }
      );

      if (updateError) {
        setError(updateError);
        return false;
      }

      setWorkspaces((prev) =>
        prev.map((w) => (w.id === id ? { ...w, name } : w))
      );
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace((prev) => (prev ? { ...prev, name } : prev));
      }

      return true;
    },
    [currentWorkspace]
  );

  /** ワークスペース削除 */
  const deleteWorkspace = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      const { error: deleteError } = await fetchJSON(
        `/api/workspaces/${id}`,
        { method: 'DELETE' }
      );

      if (deleteError) {
        setError(deleteError);
        return false;
      }

      setWorkspaces((prev) => {
        const updated = prev.filter((w) => w.id !== id);
        if (currentWorkspace?.id === id) {
          setCurrentWorkspace(updated[0] ?? null);
        }
        return updated;
      });

      return true;
    },
    [currentWorkspace]
  );

  /** メンバー一覧を取得 */
  const fetchMembers = useCallback(
    async (workspaceId: string): Promise<void> => {
      setError(null);
      const { data, error: fetchError } = await fetchJSON<{
        members: WorkspaceMemberWithUser[];
      }>(`/api/workspaces/${workspaceId}/members`);

      if (fetchError) {
        setError(fetchError);
        return;
      }

      setMembers(data?.members ?? []);
    },
    []
  );

  /** メンバー追加 */
  const addMember = useCallback(
    async (
      workspaceId: string,
      email: string,
      role: 'ADMIN' | 'MEMBER'
    ): Promise<boolean> => {
      setError(null);
      const { data, error: addError } = await fetchJSON<{
        member: WorkspaceMemberWithUser;
      }>(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });

      if (addError) {
        setError(addError);
        return false;
      }

      if (data?.member) {
        setMembers((prev) => [...prev, data.member]);
      }

      return true;
    },
    []
  );

  /** メンバーロール変更 */
  const updateMemberRole = useCallback(
    async (
      workspaceId: string,
      userId: string,
      role: WorkspaceRole
    ): Promise<boolean> => {
      setError(null);
      const { error: updateError } = await fetchJSON(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ role }),
        }
      );

      if (updateError) {
        setError(updateError);
        return false;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === userId ? { ...m, role } : m
        )
      );

      return true;
    },
    []
  );

  /** メンバー削除 */
  const removeMember = useCallback(
    async (workspaceId: string, userId: string): Promise<boolean> => {
      setError(null);
      const { error: deleteError } = await fetchJSON(
        `/api/workspaces/${workspaceId}/members/${userId}`,
        { method: 'DELETE' }
      );

      if (deleteError) {
        setError(deleteError);
        return false;
      }

      setMembers((prev) => prev.filter((m) => m.user_id !== userId));

      return true;
    },
    []
  );

  // 初回マウント時にワークスペース一覧を取得
  useEffect(() => {
    fetchWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    workspaces,
    currentWorkspace,
    members,
    loading,
    error,
    fetchWorkspaces,
    selectWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    fetchMembers,
    addMember,
    updateMemberRole,
    removeMember,
  };
}
