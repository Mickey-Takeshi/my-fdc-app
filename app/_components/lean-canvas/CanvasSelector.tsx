/**
 * app/_components/lean-canvas/CanvasSelector.tsx
 *
 * Phase 16: Canvas選択・作成コンポーネント
 */

'use client';

import { useState } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { GlassCard } from '../brand/GlassCard';

export function CanvasSelector() {
  const { canvases, currentCanvas, selectCanvas, createCanvas, deleteCanvas, loading } = useLeanCanvas();
  const { role } = useWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const canvas = await createCanvas({ title: newTitle.trim() });
    if (canvas) {
      await selectCanvas(canvas.id);
      setNewTitle('');
      setShowCreate(false);
    }
    setCreating(false);
  };

  const handleDelete = async (canvasId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('このCanvasを削除しますか？')) return;
    await deleteCanvas(canvasId);
  };

  const canDelete = role === 'OWNER' || role === 'ADMIN';

  return (
    <GlassCard style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: 'white' }}>Lean Canvas</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
          }}
        >
          <Plus size={16} />
          新規作成
        </button>
      </div>

      {/* 作成フォーム */}
      {showCreate && (
        <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Canvas名を入力..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '14px',
              marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setShowCreate(false); setNewTitle(''); }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              キャンセル
            </button>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || creating}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--primary)',
                color: 'white',
                cursor: newTitle.trim() && !creating ? 'pointer' : 'not-allowed',
                opacity: newTitle.trim() && !creating ? 1 : 0.5,
                fontSize: '14px',
              }}
            >
              {creating ? '作成中...' : '作成'}
            </button>
          </div>
        </div>
      )}

      {/* Canvas一覧 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.5)' }}>
          読み込み中...
        </div>
      ) : canvases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.5)' }}>
          Canvasがありません。新規作成してください。
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {canvases.map((canvas) => (
            <div
              key={canvas.id}
              onClick={() => selectCanvas(canvas.id)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: `2px solid ${currentCanvas?.id === canvas.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'}`,
                background: currentCanvas?.id === canvas.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <FileText size={16} color="rgba(255, 255, 255, 0.7)" />
              <span style={{ color: 'white', fontSize: '14px' }}>{canvas.title}</span>
              {canDelete && (
                <button
                  onClick={(e) => handleDelete(canvas.id, e)}
                  style={{
                    padding: '4px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    marginLeft: '4px',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
