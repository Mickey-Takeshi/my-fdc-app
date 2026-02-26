/**
 * lib/contexts/WorkspaceContext.tsx
 *
 * ワークスペースコンテキスト
 * Phase 5: Workspace & ロール管理
 *
 * - 現在のワークスペース情報
 * - ユーザーのロール
 * - メンバー一覧
 * - ワークスペース切り替え
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceWithRole,
} from '@/lib/types/workspace';

// ========================================
// 型定義
// ========================================

interface WorkspaceContextValue {
  // 現在のワークスペース
  workspace: Workspace | null;
  // ユーザーのロール
  role: WorkspaceRole | null;
  // 所属ワークスペース一覧
  workspaces: WorkspaceWithRole[];
  // メンバー一覧
  members: WorkspaceMember[];
  // ローディング状態
  loading: boolean;
  // エラー
  error: string | null;
  // ワークスペース切り替え
  switchWorkspace: (workspaceId: string) => Promise<void>;
  // ワークスペース作成
  createWorkspace: (name: string) => Promise<Workspace | null>;
  // メンバー一覧再読み込み
  reloadMembers: () => Promise<void>;
  // ワークスペース一覧再読み込み
  reloadWorkspaces: () => Promise<void>;
}

// ========================================
// Context
// ========================================

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ========================================
// Provider
// ========================================

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user, loading: authLoading } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<WorkspaceRole | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ワークスペース一覧取得
  const loadWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setWorkspace(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const res = await fetch('/api/workspaces', {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch workspaces');
      }

      const data = await res.json();
      const ws = (data.workspaces || []) as WorkspaceWithRole[];
      setWorkspaces(ws);

      // 現在のワークスペースがなければ最初のを選択
      if (ws.length > 0 && !workspace) {
        const first = ws[0];
        setWorkspace({
          id: first.id,
          name: first.name,
          createdAt: first.createdAt,
          updatedAt: first.updatedAt,
        });
        setRole(first.role);
      }

      console.log('[WorkspaceContext] Loaded workspaces:', ws.length);
    } catch (err) {
      console.error('[WorkspaceContext] Load error:', err);
      setError('ワークスペースの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user, workspace]);

  // メンバー一覧取得
  const loadMembers = useCallback(async () => {
    if (!workspace) {
      setMembers([]);
      return;
    }

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await res.json();
      setMembers(data.members || []);
      console.log('[WorkspaceContext] Loaded members:', data.members?.length);
    } catch (err) {
      console.error('[WorkspaceContext] Load members error:', err);
    }
  }, [workspace]);

  // ワークスペース切り替え
  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      const ws = workspaces.find((w) => w.id === workspaceId);
      if (ws) {
        setWorkspace({
          id: ws.id,
          name: ws.name,
          createdAt: ws.createdAt,
          updatedAt: ws.updatedAt,
        });
        setRole(ws.role);
        console.log('[WorkspaceContext] Switched to:', ws.name);
      }
    },
    [workspaces]
  );

  // ワークスペース作成
  const createWorkspace = useCallback(async (name: string): Promise<Workspace | null> => {
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create workspace');
      }

      const data = await res.json();
      const newWorkspace = data.workspace as WorkspaceWithRole;

      // 一覧を更新
      setWorkspaces((prev) => [...prev, newWorkspace]);

      // 新しいワークスペースに切り替え
      setWorkspace({
        id: newWorkspace.id,
        name: newWorkspace.name,
        createdAt: newWorkspace.createdAt,
        updatedAt: newWorkspace.updatedAt,
      });
      setRole(newWorkspace.role);

      console.log('[WorkspaceContext] Created workspace:', newWorkspace.name);
      return newWorkspace;
    } catch (err) {
      console.error('[WorkspaceContext] Create error:', err);
      setError(err instanceof Error ? err.message : 'ワークスペースの作成に失敗しました');
      return null;
    }
  }, []);

  // 初期読み込み
  useEffect(() => {
    if (!authLoading) {
      loadWorkspaces();
    }
  }, [authLoading, loadWorkspaces]);

  // ワークスペース変更時にメンバー読み込み
  useEffect(() => {
    if (workspace) {
      loadMembers();
    }
  }, [workspace, loadMembers]);

  // ========================================
  // Context Value
  // ========================================

  const value: WorkspaceContextValue = useMemo(
    () => ({
      workspace,
      role,
      workspaces,
      members,
      loading: loading || authLoading,
      error,
      switchWorkspace,
      createWorkspace,
      reloadMembers: loadMembers,
      reloadWorkspaces: loadWorkspaces,
    }),
    [
      workspace,
      role,
      workspaces,
      members,
      loading,
      authLoading,
      error,
      switchWorkspace,
      createWorkspace,
      loadMembers,
      loadWorkspaces,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ========================================
// Hook
// ========================================

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
