/**
 * lib/contexts/MVVContext.tsx
 *
 * Phase 17: MVV Context
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { useBrand } from './BrandContext';
import { MVV, MVVInput } from '@/lib/types/mvv';

interface MVVContextValue {
  mvv: MVV | null;
  loading: boolean;
  error: string | null;
  fetchMVV: () => Promise<void>;
  updateMVV: (input: MVVInput) => Promise<void>;
}

const MVVContext = createContext<MVVContextValue | undefined>(undefined);

export function MVVProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const { currentBrand } = useBrand();
  const [mvv, setMVV] = useState<MVV | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MVV取得
  const fetchMVV = useCallback(async () => {
    if (!workspace || !currentBrand) {
      setMVV(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/brands/${currentBrand.id}/mvv`
      );
      if (!res.ok) {
        if (res.status === 404) {
          setMVV(null);
          return;
        }
        throw new Error('Failed to fetch MVV');
      }
      const data = await res.json();
      setMVV(data.mvv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [workspace, currentBrand]);

  // MVV更新（upsert）
  const updateMVV = useCallback(async (input: MVVInput) => {
    if (!workspace || !currentBrand) return;

    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/brands/${currentBrand.id}/mvv`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      if (!res.ok) throw new Error('Failed to update MVV');
      const data = await res.json();
      setMVV(data.mvv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [workspace, currentBrand]);

  // ブランド変更時にリセット
  useEffect(() => {
    setMVV(null);
    if (workspace && currentBrand) {
      fetchMVV();
    }
  }, [workspace, currentBrand, fetchMVV]);

  return (
    <MVVContext.Provider
      value={{
        mvv,
        loading,
        error,
        fetchMVV,
        updateMVV,
      }}
    >
      {children}
    </MVVContext.Provider>
  );
}

export function useMVV() {
  const context = useContext(MVVContext);
  if (!context) {
    throw new Error('useMVV must be used within a MVVProvider');
  }
  return context;
}
