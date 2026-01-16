/**
 * app/_components/lean-canvas/BlockCard.tsx
 *
 * Phase 16: 個別ブロックカード
 */

'use client';

import { useState, useEffect } from 'react';
import { Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { LeanCanvasBlockType, LeanCanvasBlockDefinition } from '@/lib/types/lean-canvas';
import { useLeanCanvas } from '@/lib/contexts/LeanCanvasContext';

interface BlockCardProps {
  definition: LeanCanvasBlockDefinition;
}

export function BlockCard({ definition }: BlockCardProps) {
  const { getBlockContent, updateBlock, currentCanvas } = useLeanCanvas();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);

  const block = getBlockContent(definition.type);

  useEffect(() => {
    setContent(block?.content || '');
    setItems(block?.items || []);
  }, [block]);

  const handleSave = async () => {
    setSaving(true);
    await updateBlock(definition.type, { content, items });
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setContent(block?.content || '');
    setItems(block?.items || []);
    setEditing(false);
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems([...items, newItem.trim()]);
    setNewItem('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  if (!currentCanvas) return null;

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${definition.color}40`,
        borderRadius: '12px',
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: definition.color,
              }}
            />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'white' }}>
              {definition.label}
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
            {definition.description}
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: '4px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
            }}
          >
            <Edit2 size={12} />
          </button>
        )}
      </div>

      {/* コンテンツ */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={definition.placeholder}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '13px',
                resize: 'none',
                minHeight: '60px',
                boxSizing: 'border-box',
              }}
            />

            {/* アイテムリスト編集 */}
            <div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder="項目を追加..."
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontSize: '12px',
                  }}
                />
                <button
                  onClick={addItem}
                  disabled={!newItem.trim()}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: definition.color,
                    color: 'white',
                    cursor: newItem.trim() ? 'pointer' : 'not-allowed',
                    opacity: newItem.trim() ? 1 : 0.5,
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ flex: 1, fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>{item}</span>
                    <button
                      onClick={() => removeItem(index)}
                      style={{
                        padding: '2px',
                        border: 'none',
                        background: 'transparent',
                        color: 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* アクションボタン */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: 'auto' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                }}
              >
                <X size={12} />
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: definition.color,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                }}
              >
                <Save size={12} />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {content && (
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {content}
              </p>
            )}
            {items.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {items.map((item, index) => (
                  <li key={index} style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {!content && items.length === 0 && (
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.3)', fontStyle: 'italic' }}>
                {definition.placeholder}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
