'use client';

/**
 * app/(app)/brand/_components/BrandProfile.tsx
 *
 * ブランド基本情報 編集コンポーネント（Phase 15）
 */

import { useState, useEffect } from 'react';
import { Save, Edit3 } from 'lucide-react';
import type { Brand } from '@/lib/types/brand';

interface BrandProfileProps {
  brand: Brand;
  onUpdate: (data: { name?: string; tagline?: string; story?: string }) => Promise<boolean>;
}

export default function BrandProfile({ brand, onUpdate }: BrandProfileProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(brand.name);
  const [tagline, setTagline] = useState(brand.tagline);
  const [story, setStory] = useState(brand.story);
  const [saving, setSaving] = useState(false);

  // brand prop が変更されたら内部状態を同期
  useEffect(() => {
    setName(brand.name);
    setTagline(brand.tagline);
    setStory(brand.story);
    setEditing(false);
  }, [brand]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onUpdate({ name, tagline, story });
    if (ok) setEditing(false);
    setSaving(false);
  };

  if (!editing) {
    return (
      <div className="glass-card brand-profile">
        <div className="brand-profile-header">
          <h2 className="brand-name">{brand.name}</h2>
          <button className="btn btn-outline btn-small" onClick={() => setEditing(true)}>
            <Edit3 size={14} /> 編集
          </button>
        </div>
        {brand.tagline && <p className="brand-tagline">{brand.tagline}</p>}
        {brand.story && <p className="brand-story">{brand.story}</p>}
      </div>
    );
  }

  return (
    <div className="glass-card brand-profile">
      <div className="brand-profile-header">
        <h3>ブランド情報を編集</h3>
        <button
          className="btn btn-primary btn-small"
          onClick={handleSave}
          disabled={saving || !name.trim()}
        >
          <Save size={14} /> {saving ? '保存中...' : '保存'}
        </button>
      </div>
      <div className="form-group">
        <label className="form-label">ブランド名</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ブランド名"
        />
      </div>
      <div className="form-group">
        <label className="form-label">タグライン</label>
        <input
          className="form-input"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="ブランドのキャッチフレーズ"
        />
      </div>
      <div className="form-group">
        <label className="form-label">ストーリー</label>
        <textarea
          className="form-input"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="ブランドの物語"
          rows={4}
        />
      </div>
    </div>
  );
}
