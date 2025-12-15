/**
 * app/_components/mvv/MVVSection.tsx
 *
 * Phase 17: Mission/Vision/Value 個別セクション
 */

'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { MVVSectionDefinition } from '@/lib/types/mvv';

interface MVVSectionProps {
  definition: MVVSectionDefinition;
  value: string | string[];
  onSave: (value: string | string[]) => Promise<void>;
}

export function MVVSection({ definition, value, onSave }: MVVSectionProps) {
  const isArray = definition.key === 'values';
  const [editValue, setEditValue] = useState<string>(isArray ? '' : (value as string) || '');
  const [items, setItems] = useState<string[]>(isArray ? (value as string[]) || [] : []);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (isArray) {
      setItems((value as string[]) || []);
    } else {
      setEditValue((value as string) || '');
    }
  }, [value, isArray]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isArray) {
        await onSave(items);
      } else {
        await onSave(editValue);
      }
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems([...items, newItem.trim()]);
    setNewItem('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        padding: '20px',
        background: `${definition.color}10`,
        border: `1px solid ${definition.color}30`,
        borderRadius: '12px',
      }}
    >
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '24px' }}>{definition.icon}</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>{definition.label}</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
            {definition.description}
          </p>
        </div>
      </div>

      {/* 入力エリア */}
      {isArray ? (
        <div>
          {/* 追加フォーム */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder={definition.placeholder}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px',
              }}
            />
            <button
              onClick={addItem}
              disabled={!newItem.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: definition.color,
                color: 'white',
                cursor: newItem.trim() ? 'pointer' : 'not-allowed',
                opacity: newItem.trim() ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Plus size={16} />
              追加
            </button>
          </div>

          {/* アイテムリスト */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '14px', color: definition.color, fontWeight: 600 }}>
                  {index + 1}.
                </span>
                <span style={{ flex: 1, fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
                  {item}
                </span>
                <button
                  onClick={() => removeItem(index)}
                  style={{
                    padding: '4px',
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                価値観を追加してください
              </div>
            )}
          </div>
        </div>
      ) : (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={definition.placeholder}
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            fontSize: '14px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      )}

      {/* 保存ボタン */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: `linear-gradient(135deg, ${definition.color}, ${definition.color}cc)`,
            color: 'white',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
          }}
        >
          <Save size={16} />
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
