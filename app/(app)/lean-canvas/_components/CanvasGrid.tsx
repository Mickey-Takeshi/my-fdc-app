'use client';

/**
 * app/(app)/lean-canvas/_components/CanvasGrid.tsx
 *
 * 9ブロック Lean Canvas グリッド（Phase 16）
 */

import { useState } from 'react';
import { Save, Plus, X } from 'lucide-react';
import {
  ALL_BLOCK_TYPES,
  BLOCK_TYPE_LABELS,
  type LeanCanvasBlock,
  type LeanCanvasBlockType,
} from '@/lib/types/lean-canvas';

interface CanvasGridProps {
  blocks: LeanCanvasBlock[];
  onSaveBlock: (
    blockType: LeanCanvasBlockType,
    content: string,
    items: string[]
  ) => Promise<boolean>;
}

/** グリッド配置マッピング */
const GRID_POSITIONS: Record<LeanCanvasBlockType, { col: string; row: string }> = {
  problem: { col: '1 / 2', row: '1 / 2' },
  solution: { col: '2 / 3', row: '1 / 2' },
  unique_value: { col: '3 / 4', row: '1 / 3' },
  unfair_advantage: { col: '4 / 5', row: '1 / 2' },
  customer_segments: { col: '5 / 6', row: '1 / 2' },
  key_metrics: { col: '1 / 2', row: '2 / 3' },
  channels: { col: '5 / 6', row: '2 / 3' },
  cost_structure: { col: '1 / 4', row: '3 / 4' },
  revenue_streams: { col: '4 / 6', row: '3 / 4' },
};

export default function CanvasGrid({ blocks, onSaveBlock }: CanvasGridProps) {
  const [editingBlock, setEditingBlock] = useState<LeanCanvasBlockType | null>(null);
  const [editItems, setEditItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);

  const getBlock = (type: LeanCanvasBlockType): LeanCanvasBlock | undefined => {
    return blocks.find((b) => b.blockType === type);
  };

  const handleEdit = (type: LeanCanvasBlockType) => {
    const block = getBlock(type);
    setEditingBlock(type);
    setEditItems(block?.items ?? []);
    setNewItem('');
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      setEditItems((prev) => [...prev, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!editingBlock) return;
    setSaving(true);
    const ok = await onSaveBlock(editingBlock, '', editItems);
    if (ok) setEditingBlock(null);
    setSaving(false);
  };

  return (
    <div className="canvas-grid">
      {ALL_BLOCK_TYPES.map((type) => {
        const block = getBlock(type);
        const pos = GRID_POSITIONS[type];
        const isEditing = editingBlock === type;

        return (
          <div
            key={type}
            className={`canvas-block glass-card ${isEditing ? 'editing' : ''}`}
            style={{ gridColumn: pos.col, gridRow: pos.row }}
          >
            <div className="canvas-block-header">
              <span className="canvas-block-title">
                {BLOCK_TYPE_LABELS[type]}
              </span>
              {!isEditing && (
                <button
                  className="canvas-block-edit-btn"
                  onClick={() => handleEdit(type)}
                  title="編集"
                >
                  <Plus size={12} />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="canvas-block-editor">
                <div className="canvas-block-items-edit">
                  {editItems.map((item, i) => (
                    <div key={i} className="canvas-block-item-edit">
                      <span>{item}</span>
                      <button onClick={() => handleRemoveItem(i)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="canvas-block-add-item">
                  <input
                    className="form-input"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="項目を追加..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    className="btn btn-outline btn-small"
                    onClick={handleAddItem}
                    disabled={!newItem.trim()}
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <div className="canvas-block-actions">
                  <button
                    className="btn btn-outline btn-small"
                    onClick={() => setEditingBlock(null)}
                  >
                    キャンセル
                  </button>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save size={12} /> {saving ? '...' : '保存'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="canvas-block-content">
                {block && block.items.length > 0 ? (
                  <ul className="canvas-block-items">
                    {block.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="canvas-block-empty">
                    クリックして追加
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
