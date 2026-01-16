/**
 * lib/contexts/LeadsContext.tsx
 *
 * Phase 6: Leads Context
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
import type { Lead, LeadStatus, CreateLeadInput } from '@/lib/types/lead';

interface LeadsContextValue {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  // CRUD
  addLead: (input: CreateLeadInput) => Promise<Lead | null>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<Lead | null>;
  updateStatus: (id: string, status: LeadStatus) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  // 一括操作
  addLeads: (inputs: CreateLeadInput[]) => Promise<void>;
  // 再読み込み
  reloadLeads: () => Promise<void>;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // リード一覧取得
  const loadLeads = useCallback(async () => {
    if (!workspace) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspace.id}/leads`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch leads');
      }

      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('[LeadsContext] Load error:', err);
      setError('リードの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // ワークスペース変更時に読み込み
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // リード追加
  const addLead = useCallback(
    async (input: CreateLeadInput): Promise<Lead | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error('Failed to create lead');
        }

        const data = await res.json();
        setLeads((prev) => [data.lead, ...prev]);
        return data.lead;
      } catch (err) {
        console.error('[LeadsContext] Add error:', err);
        setError('リードの追加に失敗しました');
        return null;
      }
    },
    [workspace]
  );

  // リード更新
  const updateLead = useCallback(
    async (id: string, updates: Partial<Lead>): Promise<Lead | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          throw new Error('Failed to update lead');
        }

        const data = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === id ? data.lead : l)));
        return data.lead;
      } catch (err) {
        console.error('[LeadsContext] Update error:', err);
        setError('リードの更新に失敗しました');
        return null;
      }
    },
    [workspace]
  );

  // ステータス更新
  const updateStatus = useCallback(
    async (id: string, status: LeadStatus): Promise<void> => {
      await updateLead(id, { status });
    },
    [updateLead]
  );

  // リード削除
  const deleteLead = useCallback(
    async (id: string): Promise<void> => {
      if (!workspace) return;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/leads/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to delete lead');
        }

        setLeads((prev) => prev.filter((l) => l.id !== id));
      } catch (err) {
        console.error('[LeadsContext] Delete error:', err);
        setError('リードの削除に失敗しました');
      }
    },
    [workspace]
  );

  // 一括追加
  const addLeads = useCallback(
    async (inputs: CreateLeadInput[]): Promise<void> => {
      await Promise.all(inputs.map((input) => addLead(input)));
    },
    [addLead]
  );

  const value: LeadsContextValue = useMemo(
    () => ({
      leads,
      loading,
      error,
      addLead,
      updateLead,
      updateStatus,
      deleteLead,
      addLeads,
      reloadLeads: loadLeads,
    }),
    [
      leads,
      loading,
      error,
      addLead,
      updateLead,
      updateStatus,
      deleteLead,
      addLeads,
      loadLeads,
    ]
  );

  return (
    <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>
  );
}

export function useLeads(): LeadsContextValue {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error('useLeads must be used within LeadsProvider');
  }
  return context;
}
