'use client';

/**
 * app/(app)/brand/_components/AddBrandForm.tsx
 *
 * ブランド作成フォーム（Phase 15）
 */

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface AddBrandFormProps {
  onSubmit: (data: { name: string; tagline: string; story: string }) => Promise<boolean>;
  onClose: () => void;
}

export default function AddBrandForm({ onSubmit, onClose }: AddBrandFormProps) {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [story, setStory] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const ok = await onSubmit({ name: name.trim(), tagline, story });
    if (ok) onClose();
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>ブランドを作成</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">ブランド名 *</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: My SaaS Product"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">タグライン</label>
              <input
                className="form-input"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="例: 起業家のための最強ツール"
              />
            </div>
            <div className="form-group">
              <label className="form-label">ストーリー</label>
              <textarea
                className="form-input"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="ブランドの誕生ストーリー..."
                rows={3}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !name.trim()}
            >
              <Plus size={16} />
              {saving ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
