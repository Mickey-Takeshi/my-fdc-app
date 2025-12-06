/**
 * app/_components/action-map/ActionMapFormModal.tsx
 *
 * Phase 11: Action Map 作成/編集モーダル
 */

'use client';

import type { ActionMapFormData } from '@/lib/hooks/useActionMapViewModel';
import styles from './FormModal.module.css';

interface ActionMapFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: ActionMapFormData;
  saving: boolean;
  onClose: () => void;
  onChange: (data: Partial<ActionMapFormData>) => void;
  onSave: () => void;
}

export function ActionMapFormModal({
  isOpen,
  isEditing,
  formData,
  saving,
  onClose,
  onChange,
  onSave,
}: ActionMapFormModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? 'Action Map を編集' : '新規 Action Map 作成'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>
                タイトル <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="例: Q1 新規リード 10件獲得プラン"
                maxLength={100}
                required
                autoFocus
              />
              <span className={styles.hint}>{formData.title.length}/100</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>説明</label>
              <textarea
                className={styles.textarea}
                value={formData.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="この Action Map の目的や背景を記述..."
                maxLength={1000}
                rows={3}
              />
              <span className={styles.hint}>{formData.description.length}/1000</span>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>開始日</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.targetPeriodStart}
                  onChange={(e) => onChange({ targetPeriodStart: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>終了日</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.targetPeriodEnd}
                  onChange={(e) => onChange({ targetPeriodEnd: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={saving}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving || !formData.title.trim()}
            >
              {saving ? '保存中...' : isEditing ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
