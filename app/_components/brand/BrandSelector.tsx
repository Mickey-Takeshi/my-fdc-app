/**
 * app/_components/brand/BrandSelector.tsx
 *
 * Phase 15: ブランド選択・作成コンポーネント
 */

'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useBrand } from '@/lib/contexts/BrandContext';
import { GlassCard } from './GlassCard';

export function BrandSelector() {
  const { brands, currentBrand, selectBrand, createBrand, loading } = useBrand();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setCreating(true);
    await createBrand(newName, newTagline || undefined);
    setNewName('');
    setNewTagline('');
    setShowCreate(false);
    setCreating(false);
  };

  if (loading && brands.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.6)' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* ブランド選択 */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {brands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => selectBrand(brand.id)}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: currentBrand?.id === brand.id
                ? '2px solid var(--primary)'
                : '1px solid rgba(255, 255, 255, 0.2)',
              background: currentBrand?.id === brand.id
                ? 'rgba(59, 130, 246, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={16} />
            {brand.name}
          </button>
        ))}

        {/* 新規作成ボタン */}
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px dashed rgba(255, 255, 255, 0.3)',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={16} />
          新規ブランド
        </button>
      </div>

      {/* 新規作成フォーム */}
      {showCreate && (
        <GlassCard style={{ marginTop: '16px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: 'white' }}>新規ブランド作成</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="ブランド名 *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px',
              }}
            />
            <input
              type="text"
              placeholder="タグライン（任意）"
              value={newTagline}
              onChange={(e) => setNewTagline(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  cursor: newName.trim() && !creating ? 'pointer' : 'not-allowed',
                  opacity: newName.trim() && !creating ? 1 : 0.5,
                }}
              >
                {creating ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
