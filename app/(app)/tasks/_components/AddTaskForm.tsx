'use client';

/**
 * app/(app)/tasks/_components/AddTaskForm.tsx
 *
 * タスク追加モーダルフォーム（Phase 9）
 */

import { useState } from 'react';
import { X, Plus, FileText, Calendar } from 'lucide-react';
import {
  ALL_SUITS,
  SUIT_SYMBOLS,
  SUIT_LABELS,
  SUIT_DESCRIPTIONS,
  type Suit,
} from '@/lib/types/task';

interface AddTaskFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    suit: Suit | null;
    scheduled_date: string;
  }) => Promise<boolean>;
  onClose: () => void;
}

export default function AddTaskForm({ onSubmit, onClose }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suit, setSuit] = useState<Suit | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
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
      suit,
      scheduled_date: scheduledDate,
    });

    if (success) {
      onClose();
    } else {
      setError('タスクの作成に失敗しました');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>タスクを追加</h2>
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
            <label>
              <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              タイトル *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タスクのタイトルを入力..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>象限</label>
            <div className="suit-selector">
              <button
                type="button"
                className={`suit-option ${suit === null ? 'suit-option-active' : ''}`}
                onClick={() => setSuit(null)}
              >
                <span className="suit-option-symbol">?</span>
                <span className="suit-option-label">Joker</span>
              </button>
              {ALL_SUITS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`suit-option ${suit === s ? 'suit-option-active' : ''}`}
                  onClick={() => setSuit(s)}
                  title={SUIT_DESCRIPTIONS[s]}
                >
                  <span className={`suit-option-symbol suit-${s}`}>
                    {SUIT_SYMBOLS[s]}
                  </span>
                  <span className="suit-option-label">{SUIT_LABELS[s]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              予定日
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="タスクの詳細を記入..."
              style={{ minHeight: '80px' }}
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
              {isSubmitting ? '作成中...' : 'タスクを追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
