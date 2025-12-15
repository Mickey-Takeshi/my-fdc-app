/**
 * app/_components/brand/BrandProfile.tsx
 *
 * Phase 15: ブランド基本情報コンポーネント
 */

'use client';

import { useState } from 'react';
import { Edit2, Save, X, Trash2 } from 'lucide-react';
import { useBrand } from '@/lib/contexts/BrandContext';
import { GlassCard } from './GlassCard';

export function BrandProfile() {
  const { currentBrand, updateBrand, deleteBrand } = useBrand();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [story, setStory] = useState('');
  const [saving, setSaving] = useState(false);

  if (!currentBrand) {
    return (
      <GlassCard>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
          ブランドを選択または作成してください
        </p>
      </GlassCard>
    );
  }

  const startEdit = () => {
    setName(currentBrand.name);
    setTagline(currentBrand.tagline || '');
    setStory(currentBrand.story || '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateBrand(currentBrand.id, { name, tagline, story });
    setEditing(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (confirm(`「${currentBrand.name}」を削除しますか？この操作は取り消せません。`)) {
      await deleteBrand(currentBrand.id);
    }
  };

  return (
    <GlassCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ブランド名"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              />
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="タグライン"
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="ブランドストーリー"
                rows={4}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
          ) : (
            <>
              <h2 style={{ margin: '0 0 8px', fontSize: '24px', color: 'white' }}>{currentBrand.name}</h2>
              {currentBrand.tagline && (
                <p style={{ margin: '0 0 16px', color: 'var(--primary)', fontSize: '16px' }}>
                  {currentBrand.tagline}
                </p>
              )}
              {currentBrand.story && (
                <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: 1.6 }}>
                  {currentBrand.story}
                </p>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <Save size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  background: 'transparent',
                  color: '#ef4444',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
