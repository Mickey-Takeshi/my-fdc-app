'use client';

/**
 * app/(app)/okr/_components/AddObjectiveForm.tsx
 *
 * Objective 追加モーダルフォーム（Phase 11）
 */

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface AddObjectiveFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    period: string;
  }) => Promise<boolean>;
  onClose: () => void;
}

export default function AddObjectiveForm({ onSubmit, onClose }: AddObjectiveFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    if (!period.trim()) {
      setError('期間は必須です');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const success = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      period: period.trim(),
    });

    if (success) {
      onClose();
    } else {
      setError('Objective の作成に失敗しました');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Objective を追加</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 売上を2倍にする、顧客満足度を向上させる..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="目標の詳細を記入..."
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>期間 *</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="例: 2026 Q1、2026年上期..."
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Plus size={16} />
              {isSubmitting ? '作成中...' : 'Objective を追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
