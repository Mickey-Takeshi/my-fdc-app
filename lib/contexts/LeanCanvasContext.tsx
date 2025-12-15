/**
 * lib/contexts/LeanCanvasContext.tsx
 *
 * Phase 16: Lean Canvas Context
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWorkspace } from './WorkspaceContext';
import {
  LeanCanvas,
  LeanCanvasWithBlocks,
  LeanCanvasBlock,
  LeanCanvasBlockType,
  CreateLeanCanvasInput,
  UpdateLeanCanvasInput,
  UpdateBlockInput,
} from '@/lib/types/lean-canvas';

interface LeanCanvasContextValue {
  canvases: LeanCanvas[];
  currentCanvas: LeanCanvasWithBlocks | null;
  loading: boolean;
  error: string | null;
  fetchCanvases: () => Promise<void>;
  selectCanvas: (canvasId: string) => Promise<void>;
  createCanvas: (input: CreateLeanCanvasInput) => Promise<LeanCanvas | null>;
  updateCanvas: (canvasId: string, input: UpdateLeanCanvasInput) => Promise<void>;
  deleteCanvas: (canvasId: string) => Promise<void>;
  updateBlock: (blockType: LeanCanvasBlockType, input: UpdateBlockInput) => Promise<void>;
  getBlockContent: (blockType: LeanCanvasBlockType) => LeanCanvasBlock | null;
}

const LeanCanvasContext = createContext<LeanCanvasContextValue | undefined>(undefined);

export function LeanCanvasProvider({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [canvases, setCanvases] = useState<LeanCanvas[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<LeanCanvasWithBlocks | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Canvas一覧取得
  const fetchCanvases = useCallback(async () => {
    if (!workspace) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/lean-canvas`);
      if (!res.ok) throw new Error('Failed to fetch canvases');
      const data = await res.json();
      setCanvases(data.canvases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // Canvas選択
  const selectCanvas = useCallback(async (canvasId: string) => {
    if (!workspace) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/lean-canvas/${canvasId}`);
      if (!res.ok) throw new Error('Failed to fetch canvas');
      const data = await res.json();
      setCurrentCanvas(data.canvas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  // Canvas作成
  const createCanvas = useCallback(async (input: CreateLeanCanvasInput): Promise<LeanCanvas | null> => {
    if (!workspace) return null;

    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/lean-canvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create canvas');
      const data = await res.json();
      const newCanvas = data.canvas;
      setCanvases((prev) => [...prev, newCanvas]);
      return newCanvas;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [workspace]);

  // Canvas更新
  const updateCanvas = useCallback(async (canvasId: string, input: UpdateLeanCanvasInput) => {
    if (!workspace) return;

    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/lean-canvas/${canvasId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to update canvas');
      const data = await res.json();
      const updated = data.canvas;
      setCanvases((prev) => prev.map((c) => (c.id === canvasId ? { ...c, ...updated } : c)));
      if (currentCanvas?.id === canvasId) {
        setCurrentCanvas((prev) => (prev ? { ...prev, ...updated } : prev));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [workspace, currentCanvas]);

  // Canvas削除
  const deleteCanvas = useCallback(async (canvasId: string) => {
    if (!workspace) return;

    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/lean-canvas/${canvasId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete canvas');
      setCanvases((prev) => prev.filter((c) => c.id !== canvasId));
      if (currentCanvas?.id === canvasId) {
        setCurrentCanvas(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [workspace, currentCanvas]);

  // ブロック更新
  const updateBlock = useCallback(async (blockType: LeanCanvasBlockType, input: UpdateBlockInput) => {
    if (!workspace || !currentCanvas) return;

    setError(null);

    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/lean-canvas/${currentCanvas.id}/blocks`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockType, ...input }),
        }
      );
      if (!res.ok) throw new Error('Failed to update block');
      const data = await res.json();
      const updatedBlock = data.block;

      setCurrentCanvas((prev) => {
        if (!prev) return prev;
        const existingIndex = prev.blocks.findIndex((b) => b.blockType === blockType);
        if (existingIndex >= 0) {
          const newBlocks = [...prev.blocks];
          newBlocks[existingIndex] = updatedBlock;
          return { ...prev, blocks: newBlocks };
        } else {
          return { ...prev, blocks: [...prev.blocks, updatedBlock] };
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [workspace, currentCanvas]);

  // ブロック内容取得
  const getBlockContent = useCallback((blockType: LeanCanvasBlockType): LeanCanvasBlock | null => {
    if (!currentCanvas) return null;
    return currentCanvas.blocks.find((b) => b.blockType === blockType) || null;
  }, [currentCanvas]);

  // ワークスペース変更時にリセット
  useEffect(() => {
    setCanvases([]);
    setCurrentCanvas(null);
    if (workspace) {
      fetchCanvases();
    }
  }, [workspace, fetchCanvases]);

  return (
    <LeanCanvasContext.Provider
      value={{
        canvases,
        currentCanvas,
        loading,
        error,
        fetchCanvases,
        selectCanvas,
        createCanvas,
        updateCanvas,
        deleteCanvas,
        updateBlock,
        getBlockContent,
      }}
    >
      {children}
    </LeanCanvasContext.Provider>
  );
}

export function useLeanCanvas() {
  const context = useContext(LeanCanvasContext);
  if (!context) {
    throw new Error('useLeanCanvas must be used within a LeanCanvasProvider');
  }
  return context;
}
