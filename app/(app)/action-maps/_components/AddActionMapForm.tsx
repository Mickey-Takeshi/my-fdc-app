'use client';

/**
 * app/(app)/action-maps/_components/AddActionMapForm.tsx
 *
 * ActionMap 追加モーダルフォーム（Phase 10）
 */

import { useState } from 'react';
import { X, Plus, Calendar } from 'lucide-react';

interface AddActionMapFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    target_period_start: string;
    target_period_end: string;
  }) => Promise<boolean>;
  onClose: () => void;
}

export default function AddActionMapForm({ onSubmit, onClose }: AddActionMapFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const success = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      target_period_start: periodStart,
      target_period_end: periodEnd,
    });

    if (success) {
      onClose();
    } else {
      setError('Action Mapの作成に失敗しました');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Action Map を追加</h2>
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
              placeholder="例: 新機能開発、マーケティング施策..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="施策の概要を記入..."
              style={{ minHeight: '80px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>
                <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                開始日
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>
                <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                終了日
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
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
              {isSubmitting ? '作成中...' : 'Action Map を追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
