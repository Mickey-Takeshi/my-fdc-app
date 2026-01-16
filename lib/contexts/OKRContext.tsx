/**
 * lib/contexts/OKRContext.tsx
 *
 * Phase 11: OKR コンテキスト
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
  Objective,
  KeyResult,
  CreateObjectiveInput,
  UpdateObjectiveInput,
  UpdateKeyResultInput,
} from '@/lib/types/okr';

interface OKRContextValue {
  // 状態
  objectives: Objective[];
  selectedObjective: (Objective & { keyResults: KeyResult[] }) | null;
  loading: boolean;
  error: string | null;

  // Objective アクション
  createObjective: (input: CreateObjectiveInput) => Promise<Objective | null>;
  updateObjective: (id: string, input: UpdateObjectiveInput) => Promise<Objective | null>;
  deleteObjective: (id: string) => Promise<void>;
  selectObjective: (id: string) => Promise<void>;
  clearSelectedObjective: () => void;
  archiveObjective: (id: string) => Promise<void>;

  // Key Result アクション
  createKeyResult: (objectiveId: string, input: { title: string; targetValue: number; unit: string }) => Promise<KeyResult | null>;
  updateKeyResult: (objectiveId: string, krId: string, input: UpdateKeyResultInput) => Promise<KeyResult | null>;
  deleteKeyResult: (objectiveId: string, krId: string) => Promise<void>;

  // リロード
  reloadObjectives: () => Promise<void>;
}

const OKRContext = createContext<OKRContextValue | null>(null);

export function OKRProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<(Objective & { keyResults: KeyResult[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = workspace?.id;

  // Objective一覧取得
  const fetchObjectives = useCallback(async () => {
    if (!workspaceId) return [];

    const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives`);
    if (!res.ok) return [];
    return res.json();
  }, [workspaceId]);

  // 初期読み込み
  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const loadObjectives = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchObjectives();
        setObjectives(data);
      } catch (err) {
        console.error('Error loading objectives:', err);
        setError('OKRの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadObjectives();
  }, [workspaceId, fetchObjectives]);

  // Objective選択（詳細取得）
  const selectObjective = useCallback(async (id: string) => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setSelectedObjective(data);
    } catch (err) {
      console.error('Error selecting objective:', err);
      setError('Objectiveの取得に失敗しました');
    }
  }, [workspaceId]);

  // 選択解除
  const clearSelectedObjective = useCallback(() => {
    setSelectedObjective(null);
  }, []);

  // Objective作成
  const createObjective = useCallback(async (input: CreateObjectiveInput): Promise<Objective | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to create');

      const newObjective = await res.json();
      setObjectives((prev) => [newObjective, ...prev]);
      return newObjective;
    } catch (err) {
      console.error('Error creating objective:', err);
      setError('Objectiveの作成に失敗しました');
      return null;
    }
  }, [workspaceId]);

  // Objective更新
  const updateObjective = useCallback(async (id: string, input: UpdateObjectiveInput): Promise<Objective | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();
      setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      return updated;
    } catch (err) {
      console.error('Error updating objective:', err);
      setError('Objectiveの更新に失敗しました');
      return null;
    }
  }, [workspaceId]);

  // Objective削除
  const deleteObjective = useCallback(async (id: string): Promise<void> => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setObjectives((prev) => prev.filter((o) => o.id !== id));
      if (selectedObjective?.id === id) {
        setSelectedObjective(null);
      }
    } catch (err) {
      console.error('Error deleting objective:', err);
      setError('Objectiveの削除に失敗しました');
    }
  }, [workspaceId, selectedObjective]);

  // Objectiveアーカイブ
  const archiveObjective = useCallback(async (id: string): Promise<void> => {
    await updateObjective(id, { isArchived: true });
  }, [updateObjective]);

  // Key Result作成
  const createKeyResult = useCallback(async (
    objectiveId: string,
    input: { title: string; targetValue: number; unit: string }
  ): Promise<KeyResult | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${objectiveId}/key-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to create');

      const newKR = await res.json();

      // selectedObjectiveを更新
      if (selectedObjective?.id === objectiveId) {
        setSelectedObjective((prev) => prev ? {
          ...prev,
          keyResults: [...prev.keyResults, newKR],
          keyResultCount: (prev.keyResultCount || 0) + 1,
        } : null);
      }

      // Objectives一覧も更新
      setObjectives((prev) => prev.map((o) =>
        o.id === objectiveId ? { ...o, keyResultCount: (o.keyResultCount || 0) + 1 } : o
      ));

      return newKR;
    } catch (err) {
      console.error('Error creating key result:', err);
      setError('Key Resultの作成に失敗しました');
      return null;
    }
  }, [workspaceId, selectedObjective]);

  // Key Result更新
  const updateKeyResult = useCallback(async (
    objectiveId: string,
    krId: string,
    input: UpdateKeyResultInput
  ): Promise<KeyResult | null> => {
    if (!workspaceId) return null;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${objectiveId}/key-results/${krId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();

      // selectedObjectiveを更新
      if (selectedObjective?.id === objectiveId) {
        setSelectedObjective((prev) => prev ? {
          ...prev,
          keyResults: prev.keyResults.map((kr) => (kr.id === krId ? { ...kr, ...updated } : kr)),
        } : null);
      }

      return updated;
    } catch (err) {
      console.error('Error updating key result:', err);
      setError('Key Resultの更新に失敗しました');
      return null;
    }
  }, [workspaceId, selectedObjective]);

  // Key Result削除
  const deleteKeyResult = useCallback(async (objectiveId: string, krId: string): Promise<void> => {
    if (!workspaceId) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/okr/objectives/${objectiveId}/key-results/${krId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      // selectedObjectiveを更新
      if (selectedObjective?.id === objectiveId) {
        setSelectedObjective((prev) => prev ? {
          ...prev,
          keyResults: prev.keyResults.filter((kr) => kr.id !== krId),
          keyResultCount: Math.max((prev.keyResultCount || 0) - 1, 0),
        } : null);
      }

      // Objectives一覧も更新
      setObjectives((prev) => prev.map((o) =>
        o.id === objectiveId ? { ...o, keyResultCount: Math.max((o.keyResultCount || 0) - 1, 0) } : o
      ));
    } catch (err) {
      console.error('Error deleting key result:', err);
      setError('Key Resultの削除に失敗しました');
    }
  }, [workspaceId, selectedObjective]);

  // リロード
  const reloadObjectives = useCallback(async () => {
    const data = await fetchObjectives();
    setObjectives(data);
  }, [fetchObjectives]);

  return (
    <OKRContext.Provider
      value={{
        objectives,
        selectedObjective,
        loading,
        error,
        createObjective,
        updateObjective,
        deleteObjective,
        selectObjective,
        clearSelectedObjective,
        archiveObjective,
        createKeyResult,
        updateKeyResult,
        deleteKeyResult,
        reloadObjectives,
      }}
    >
      {children}
    </OKRContext.Provider>
  );
}

export function useOKR() {
  const context = useContext(OKRContext);
  if (!context) {
    throw new Error('useOKR must be used within OKRProvider');
  }
  return context;
}
