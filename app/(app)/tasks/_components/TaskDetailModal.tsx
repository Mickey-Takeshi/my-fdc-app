'use client';

/**
 * app/(app)/tasks/_components/TaskDetailModal.tsx
 *
 * タスク詳細・編集モーダル（Phase 9）
 */

import { useState } from 'react';
import {
  X,
  Save,
  FileText,
  Calendar,
  Trash2,
} from 'lucide-react';
import {
  ALL_SUITS,
  SUIT_SYMBOLS,
  SUIT_LABELS,
  SUIT_DESCRIPTIONS,
  ALL_TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type Suit,
  type TaskStatus,
} from '@/lib/types/task';

interface TaskDetailModalProps {
  task: Task;
  onUpdate: (data: Record<string, string | number | null>) => Promise<boolean>;
  onDelete: (taskId: string) => Promise<boolean>;
  onClose: () => void;
}

export default function TaskDetailModal({
  task,
  onUpdate,
  onDelete,
  onClose,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [suit, setSuit] = useState<Suit | null>(task.suit);
  const [scheduledDate, setScheduledDate] = useState(task.scheduledDate ?? '');
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }

    setIsSaving(true);
    setError('');

    const data: Record<string, string | number | null> = {
      title: title.trim(),
      description: description.trim(),
      status,
      suit: suit,
      scheduled_date: scheduledDate || null,
      due_date: dueDate || null,
    };

    const success = await onUpdate(data);
    if (success) {
      onClose();
    } else {
      setError('更新に失敗しました');
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('このタスクを削除しますか？')) return;

    setIsDeleting(true);
    const success = await onDelete(task.id);
    if (!success) {
      setError('削除に失敗しました');
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h2>タスク詳細</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label>
            <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            タイトル
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>ステータス</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            {ALL_TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
            <label>
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              期限
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ minHeight: '80px' }}
          />
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          作成日: {new Date(task.createdAt).toLocaleString('ja-JP')}
          {' / '}
          更新日: {new Date(task.updatedAt).toLocaleString('ja-JP')}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDelete}
            disabled={isSaving || isDeleting}
            style={{ color: 'var(--danger, #ef4444)' }}
          >
            <Trash2 size={16} />
            {isDeleting ? '削除中...' : '削除'}
          </button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSaving || isDeleting}
          >
            キャンセル
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving || isDeleting}
          >
            <Save size={16} />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
