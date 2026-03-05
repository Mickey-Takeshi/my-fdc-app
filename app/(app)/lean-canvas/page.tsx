'use client';

/**
 * app/(app)/lean-canvas/page.tsx
 *
 * Lean Canvas 管理ページ（Phase 16）
 * - 9ブロックグリッドレイアウト
 * - ブロック編集
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Grid3X3,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import type { Brand } from '@/lib/types/brand';
import type { LeanCanvas, LeanCanvasBlock, LeanCanvasBlockType } from '@/lib/types/lean-canvas';
import CanvasGrid from './_components/CanvasGrid';

export default function LeanCanvasPage() {
  const { currentWorkspace, loading: wsLoading } = useWorkspace();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [canvases, setCanvases] = useState<LeanCanvas[]>([]);
  const [selectedCanvas, setSelectedCanvas] = useState<LeanCanvas | null>(null);
  const [blocks, setBlocks] = useState<LeanCanvasBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const [brandsRes, canvasRes] = await Promise.all([
        fetch(`/api/brands?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`/api/lean-canvas?workspace_id=${currentWorkspace.id}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        setBrands(brandsData.brands ?? []);
      }

      if (canvasRes.ok) {
        const canvasData = await canvasRes.json();
        const list: LeanCanvas[] = canvasData.canvases ?? [];
        setCanvases(list);
        if (list.length > 0 && !selectedCanvas) {
          setSelectedCanvas(list[0]);
        }
      }
    } catch {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  const fetchBlocks = useCallback(async () => {
    if (!selectedCanvas) return;
    try {
      const res = await fetch(
        `/api/lean-canvas/${selectedCanvas.id}/blocks`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const json = await res.json();
      if (res.ok) {
        setBlocks(json.blocks ?? []);
      }
    } catch {
      // silent
    }
  }, [selectedCanvas]);

  useEffect(() => {
    if (currentWorkspace) fetchData();
  }, [currentWorkspace, fetchData]);

  useEffect(() => {
    if (selectedCanvas) fetchBlocks();
  }, [selectedCanvas, fetchBlocks]);

  const handleCreateCanvas = async () => {
    if (!currentWorkspace || brands.length === 0) {
      setError('先にブランドを作成してください');
      return;
    }

    try {
      const res = await fetch('/api/lean-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          brand_id: brands[0].id,
          title: `Lean Canvas - ${new Date().toLocaleDateString('ja-JP')}`,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setCanvases((prev) => [json.canvas, ...prev]);
        setSelectedCanvas(json.canvas);
        setBlocks([]);
      } else {
        setError(json.error || '作成に失敗しました');
      }
    } catch {
      setError('ネットワークエラー');
    }
  };

  const handleSaveBlock = async (
    blockType: LeanCanvasBlockType,
    content: string,
    items: string[]
  ): Promise<boolean> => {
    if (!selectedCanvas) return false;
    try {
      const res = await fetch(`/api/lean-canvas/${selectedCanvas.id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_type: blockType, content, items }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || '保存に失敗しました');
        return false;
      }
      setBlocks((prev) => {
        const existing = prev.findIndex((b) => b.blockType === blockType);
        if (existing >= 0) {
          return prev.map((b, i) => (i === existing ? json.block : b));
        }
        return [...prev, json.block];
      });
      return true;
    } catch {
      setError('ネットワークエラー');
      return false;
    }
  };

  if (wsLoading || !currentWorkspace) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '8px' }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {canvases.length > 1 && (
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '200px' }}
              value={selectedCanvas?.id || ''}
              onChange={(e) => {
                const c = canvases.find((cv) => cv.id === e.target.value);
                if (c) setSelectedCanvas(c);
              }}
            >
              {canvases.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )}
        </div>
        <button className="btn btn-primary" onClick={handleCreateCanvas}>
          <Plus size={16} /> キャンバスを作成
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {error}
            <button
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              x
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : selectedCanvas ? (
        <CanvasGrid blocks={blocks} onSaveBlock={handleSaveBlock} />
      ) : (
        <div className="card">
          <div className="empty-state">
            <Grid3X3 size={64} className="empty-state-icon" />
            <p>Lean Canvas がありません</p>
            <p style={{ fontSize: 14 }}>
              {brands.length === 0
                ? '先にブランドページでブランドを作成してください'
                : '上のボタンからキャンバスを作成しましょう'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
