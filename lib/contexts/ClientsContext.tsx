/**
 * lib/contexts/ClientsContext.tsx
 *
 * Phase 7: Clients Context
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
  Client,
  CreateClientInput,
  ClientHistoryEntry,
} from '@/lib/types/client';

interface ClientsContextValue {
  clients: Client[];
  loading: boolean;
  error: string | null;
  // CRUD
  addClient: (input: CreateClientInput) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<void>;
  // リード変換
  convertLead: (leadId: string) => Promise<Client | null>;
  // 履歴追加
  addHistory: (id: string, entry: ClientHistoryEntry) => Promise<void>;
  // 再読み込み
  reloadClients: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextValue | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // クライアント一覧取得
  const loadClients = useCallback(async () => {
    if (!workspace) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspace.id}/clients`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error('[ClientsContext] Load error:', err);
      setError('クライアントの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // ワークスペース変更時に読み込み
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // クライアント追加
  const addClient = useCallback(
    async (input: CreateClientInput): Promise<Client | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          throw new Error('Failed to create client');
        }

        const data = await res.json();
        setClients((prev) => [data.client, ...prev]);
        return data.client;
      } catch (err) {
        console.error('[ClientsContext] Add error:', err);
        setError('クライアントの追加に失敗しました');
        return null;
      }
    },
    [workspace]
  );

  // クライアント更新
  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>): Promise<Client | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(
          `/api/workspaces/${workspace.id}/clients/${id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updates),
          }
        );

        if (!res.ok) {
          throw new Error('Failed to update client');
        }

        const data = await res.json();
        setClients((prev) => prev.map((c) => (c.id === id ? data.client : c)));
        return data.client;
      } catch (err) {
        console.error('[ClientsContext] Update error:', err);
        setError('クライアントの更新に失敗しました');
        return null;
      }
    },
    [workspace]
  );

  // クライアント削除
  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      if (!workspace) return;

      try {
        const res = await fetch(
          `/api/workspaces/${workspace.id}/clients/${id}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );

        if (!res.ok) {
          throw new Error('Failed to delete client');
        }

        setClients((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error('[ClientsContext] Delete error:', err);
        setError('クライアントの削除に失敗しました');
      }
    },
    [workspace]
  );

  // リード変換
  const convertLead = useCallback(
    async (leadId: string): Promise<Client | null> => {
      if (!workspace) return null;

      try {
        const res = await fetch(
          `/api/workspaces/${workspace.id}/leads/${leadId}/convert`,
          {
            method: 'POST',
            credentials: 'include',
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 409) {
            // 既に変換済み
            setError('このリードは既にクライアントに変換されています');
            return null;
          }
          throw new Error(errorData.error || 'Failed to convert lead');
        }

        const data = await res.json();
        setClients((prev) => [data.client, ...prev]);
        return data.client;
      } catch (err) {
        console.error('[ClientsContext] Convert error:', err);
        setError('リードの変換に失敗しました');
        return null;
      }
    },
    [workspace]
  );

  // 履歴追加
  const addHistory = useCallback(
    async (id: string, entry: ClientHistoryEntry): Promise<void> => {
      const client = clients.find((c) => c.id === id);
      if (!client) return;

      const newHistory = [...(client.history || []), entry];
      await updateClient(id, { history: newHistory });
    },
    [clients, updateClient]
  );

  const value: ClientsContextValue = useMemo(
    () => ({
      clients,
      loading,
      error,
      addClient,
      updateClient,
      deleteClient,
      convertLead,
      addHistory,
      reloadClients: loadClients,
    }),
    [
      clients,
      loading,
      error,
      addClient,
      updateClient,
      deleteClient,
      convertLead,
      addHistory,
      loadClients,
    ]
  );

  return (
    <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>
  );
}

export function useClients(): ClientsContextValue {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClients must be used within ClientsProvider');
  }
  return context;
}
