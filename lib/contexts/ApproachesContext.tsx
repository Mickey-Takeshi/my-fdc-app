/**
 * lib/contexts/ApproachesContext.tsx
 *
 * Phase 8: Approaches Context
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { useWorkspace } from './WorkspaceContext';
import type {
  Approach,
  CreateApproachInput,
  ApproachStats,
} from '@/lib/types/approach';
import { calculateApproachStats } from '@/lib/types/approach';

interface ApproachesContextValue {
  approaches: Approach[];
  stats: ApproachStats | null;
  loading: boolean;
  error: string | null;
  // CRUD
  addApproach: (input: CreateApproachInput) => Promise<Approach | null>;
  updateApproach: (
    id: string,
    updates: Partial<Approach>
  ) => Promise<Approach | null>;
  deleteApproach: (id: string) => Promise<void>;
  // フィルター
  getApproachesByLead: (leadId: string) => Approach[];
  // 再読み込み
  reloadApproaches: () => Promise<void>;
  reloadStats: () => Promise<void>;
}

const ApproachesContext = createContext<ApproachesContextValue | null>(null);

export function ApproachesProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [approaches, setApproaches] = useState<Approach[]>([]);
  const [stats, setStats] = useState<ApproachStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // アプローチ一覧取得
  const loadApproaches = useCallback(async () => {
    if (!workspace) {
      setApproaches([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspace.id}/approaches`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch approaches');
      }

      const data = await res.json();
      const loadedApproaches = data.approaches || [];
      setApproaches(loadedApproaches);
      setStats(calculateApproachStats(loadedApproaches));
    } catch (err) {
      console.error('[ApproachesContext] Load error:', err);
      setError('アプローチの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // 統計取得
  const loadStats = useCallback(async () => {
    if (!workspace) {
      setStats(null);
      return;
    }

    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/approaches/stats`,
        {
          credentials: 'include',
        }
      );

      if (!res.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error('[ApproachesContext] Stats error:', err);
    }
  }, [workspace]);

  // ワークスペース変更時に読み込み
  useEffect(() => {
    loadApproaches();
  }, [loadApproaches]);

  // アプローチ追加
  const addApproach = useCallback(
    async (input: CreateApproachInput): Promise<Approach | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/approaches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error('Failed to create approach');
        }

        const data = await res.json();
        const newApproaches = [data.approach, ...approaches];
        setApproaches(newApproaches);
        setStats(calculateApproachStats(newApproaches));

        return data.approach;
      } catch (err) {
        console.error('[ApproachesContext] Add error:', err);
        setError('アプローチの追加に失敗しました');
        return null;
      }
    },
    [workspace, approaches]
  );

  // アプローチ更新
  const updateApproach = useCallback(
    async (id: string, updates: Partial<Approach>): Promise<Approach | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(
          `/api/workspaces/${workspace.id}/approaches/${id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updates),
          }
        );

        if (!res.ok) {
          throw new Error('Failed to update approach');
        }

        const data = await res.json();
        const newApproaches = approaches.map((a) =>
          a.id === id ? data.approach : a
        );
        setApproaches(newApproaches);
        setStats(calculateApproachStats(newApproaches));

        return data.approach;
      } catch (err) {
        console.error('[ApproachesContext] Update error:', err);
        setError('アプローチの更新に失敗しました');
        return null;
      }
    },
    [workspace, approaches]
  );

  // アプローチ削除
  const deleteApproach = useCallback(
    async (id: string): Promise<void> => {
      if (!workspace) return;

      try {
        const res = await fetch(
          `/api/workspaces/${workspace.id}/approaches/${id}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );

        if (!res.ok) {
          throw new Error('Failed to delete approach');
        }

        const newApproaches = approaches.filter((a) => a.id !== id);
        setApproaches(newApproaches);
        setStats(calculateApproachStats(newApproaches));
      } catch (err) {
        console.error('[ApproachesContext] Delete error:', err);
        setError('アプローチの削除に失敗しました');
      }
    },
    [workspace, approaches]
  );

  // リード別アプローチ取得
  const getApproachesByLead = useCallback(
    (leadId: string): Approach[] => {
      return approaches.filter((a) => a.leadId === leadId);
    },
    [approaches]
  );

  const value: ApproachesContextValue = useMemo(
    () => ({
      approaches,
      stats,
      loading,
      error,
      addApproach,
      updateApproach,
      deleteApproach,
      getApproachesByLead,
      reloadApproaches: loadApproaches,
      reloadStats: loadStats,
    }),
    [
      approaches,
      stats,
      loading,
      error,
      addApproach,
      updateApproach,
      deleteApproach,
      getApproachesByLead,
      loadApproaches,
      loadStats,
    ]
  );

  return (
    <ApproachesContext.Provider value={value}>
      {children}
    </ApproachesContext.Provider>
  );
}

export function useApproaches(): ApproachesContextValue {
  const context = useContext(ApproachesContext);
  if (!context) {
    throw new Error('useApproaches must be used within ApproachesProvider');
  }
  return context;
}
