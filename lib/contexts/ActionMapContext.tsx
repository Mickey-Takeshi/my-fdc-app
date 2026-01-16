/**
 * lib/contexts/ActionMapContext.tsx
 *
 * Phase 10: ActionMap コンテキスト
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useWorkspace } from './WorkspaceContext';
import type {
  ActionMap,
  ActionItem,
  CreateActionMapInput,
  UpdateActionMapInput,
  UpdateActionItemInput,
} from '@/lib/types/action-map';

interface ActionMapContextValue {
  // 状態
  actionMaps: ActionMap[];
  selectedMap: (ActionMap & { items: ActionItem[] }) | null;
  loading: boolean;
  error: string | null;

  // ActionMap アクション
  createMap: (input: CreateActionMapInput) => Promise<ActionMap | null>;
  updateMap: (id: string, input: UpdateActionMapInput) => Promise<ActionMap | null>;
  deleteMap: (id: string) => Promise<void>;
  selectMap: (id: string) => Promise<void>;
  clearSelectedMap: () => void;
  archiveMap: (id: string) => Promise<void>;

  // ActionItem アクション
  createItem: (mapId: string, input: { title: string; priority?: 'low' | 'medium' | 'high'; status?: 'not_started' | 'in_progress' | 'blocked' | 'done'; description?: string; dueDate?: string; parentItemId?: string; sortOrder?: number }) => Promise<ActionItem | null>;
  updateItem: (mapId: string, itemId: string, input: UpdateActionItemInput) => Promise<ActionItem | null>;
  deleteItem: (mapId: string, itemId: string) => Promise<void>;

  // リロード
  reloadMaps: () => Promise<void>;
}

const ActionMapContext = createContext<ActionMapContextValue | null>(null);

export function ActionMapProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [actionMaps, setActionMaps] = useState<ActionMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<(ActionMap & { items: ActionItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = workspace?.id;

  // ActionMap一覧取得
  const fetchMaps = useCallback(async () => {
    if (!workspaceId) return [];

    const res = await fetch(`/api/workspaces/${workspaceId}/action-maps`);
    if (!res.ok) return [];
    return res.json();
  }, [workspaceId]);

  // 初期読み込み
  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const loadMaps = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchMaps();
        setActionMaps(data);
      } catch (err) {
        console.error('Error loading action maps:', err);
        setError('ActionMapの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadMaps();
  }, [workspaceId, fetchMaps]);

  // ActionMap選択（詳細取得）
  const selectMap = useCallback(async (id: string) => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setSelectedMap(data);
    } catch (err) {
      console.error('Error selecting map:', err);
      setError('ActionMapの取得に失敗しました');
    }
  }, [workspaceId]);

  // 選択解除
  const clearSelectedMap = useCallback(() => {
    setSelectedMap(null);
  }, []);

  // ActionMap作成
  const createMap = useCallback(async (input: CreateActionMapInput): Promise<ActionMap | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to create');

      const newMap = await res.json();
      setActionMaps((prev) => [newMap, ...prev]);
      return newMap;
    } catch (err) {
      console.error('Error creating map:', err);
      setError('ActionMapの作成に失敗しました');
      return null;
    }
  }, [workspaceId]);

  // ActionMap更新
  const updateMap = useCallback(async (id: string, input: UpdateActionMapInput): Promise<ActionMap | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();
      setActionMaps((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      return updated;
    } catch (err) {
      console.error('Error updating map:', err);
      setError('ActionMapの更新に失敗しました');
      return null;
    }
  }, [workspaceId]);

  // ActionMap削除
  const deleteMap = useCallback(async (id: string): Promise<void> => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setActionMaps((prev) => prev.filter((m) => m.id !== id));
      if (selectedMap?.id === id) {
        setSelectedMap(null);
      }
    } catch (err) {
      console.error('Error deleting map:', err);
      setError('ActionMapの削除に失敗しました');
    }
  }, [workspaceId, selectedMap]);

  // ActionMapアーカイブ
  const archiveMap = useCallback(async (id: string): Promise<void> => {
    await updateMap(id, { isArchived: true });
  }, [updateMap]);

  // ActionItem作成
  const createItem = useCallback(async (
    mapId: string,
    input: { title: string; priority?: 'low' | 'medium' | 'high'; status?: 'not_started' | 'in_progress' | 'blocked' | 'done'; description?: string; dueDate?: string; parentItemId?: string; sortOrder?: number }
  ): Promise<ActionItem | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${mapId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to create');

      const newItem = await res.json();

      // selectedMapを更新
      if (selectedMap?.id === mapId) {
        setSelectedMap((prev) => prev ? {
          ...prev,
          items: [...prev.items, newItem],
        } : null);
      }

      // ActionMaps一覧も更新（itemCount）
      setActionMaps((prev) => prev.map((m) =>
        m.id === mapId ? { ...m, itemCount: (m.itemCount || 0) + 1 } : m
      ));

      return newItem;
    } catch (err) {
      console.error('Error creating item:', err);
      setError('ActionItemの作成に失敗しました');
      return null;
    }
  }, [workspaceId, selectedMap]);

  // ActionItem更新
  const updateItem = useCallback(async (
    mapId: string,
    itemId: string,
    input: UpdateActionItemInput
  ): Promise<ActionItem | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${mapId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();

      // selectedMapを更新
      if (selectedMap?.id === mapId) {
        setSelectedMap((prev) => prev ? {
          ...prev,
          items: prev.items.map((i) => (i.id === itemId ? { ...i, ...updated } : i)),
        } : null);
      }

      return updated;
    } catch (err) {
      console.error('Error updating item:', err);
      setError('ActionItemの更新に失敗しました');
      return null;
    }
  }, [workspaceId, selectedMap]);

  // ActionItem削除
  const deleteItem = useCallback(async (mapId: string, itemId: string): Promise<void> => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/action-maps/${mapId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      // selectedMapを更新
      if (selectedMap?.id === mapId) {
        setSelectedMap((prev) => prev ? {
          ...prev,
          items: prev.items.filter((i) => i.id !== itemId),
        } : null);
      }

      // ActionMaps一覧も更新（itemCount）
      setActionMaps((prev) => prev.map((m) =>
        m.id === mapId ? { ...m, itemCount: Math.max((m.itemCount || 0) - 1, 0) } : m
      ));
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('ActionItemの削除に失敗しました');
    }
  }, [workspaceId, selectedMap]);

  // リロード
  const reloadMaps = useCallback(async () => {
    const data = await fetchMaps();
    setActionMaps(data);
  }, [fetchMaps]);

  return (
    <ActionMapContext.Provider
      value={{
        actionMaps,
        selectedMap,
        loading,
        error,
        createMap,
        updateMap,
        deleteMap,
        selectMap,
        clearSelectedMap,
        archiveMap,
        createItem,
        updateItem,
        deleteItem,
        reloadMaps,
      }}
    >
      {children}
    </ActionMapContext.Provider>
  );
}

export function useActionMaps() {
  const context = useContext(ActionMapContext);
  if (!context) {
    throw new Error('useActionMaps must be used within ActionMapProvider');
  }
  return context;
}
