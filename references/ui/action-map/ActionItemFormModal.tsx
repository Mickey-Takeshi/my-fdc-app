/**
 * app/_components/action-map/ActionItemFormModal.tsx
 *
 * Phase 11: Action Item 作成/編集モーダル
 */

'use client';

import type { ActionItemFormData } from '@/lib/hooks/useActionMapViewModel';
import type { ActionItemPriority } from '@/lib/types/action-map';
import { ACTION_ITEM_PRIORITY_CONFIG } from '@/lib/types/action-map';
import styles from './FormModal.module.css';

interface ActionItemFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: ActionItemFormData;
  saving: boolean;
  onClose: () => void;
  onChange: (data: Partial<ActionItemFormData>) => void;
  onSave: () => void;
}

const PRIORITIES: ActionItemPriority[] = ['high', 'medium', 'low'];

export function ActionItemFormModal({
  isOpen,
  isEditing,
  formData,
  saving,
  onClose,
  onChange,
  onSave,
}: ActionItemFormModalProps) {
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
            {isEditing ? 'Action Item を編集' : '新規 Action Item 作成'}
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
                placeholder="例: テレアポリスト作成"
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
                placeholder="このタスクの詳細を記述..."
                maxLength={500}
                rows={3}
              />
              <span className={styles.hint}>{formData.description.length}/500</span>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>期限</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.dueDate}
                  onChange={(e) => onChange({ dueDate: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>優先度</label>
                <select
                  className={styles.select}
                  value={formData.priority}
                  onChange={(e) => onChange({ priority: e.target.value as ActionItemPriority })}
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>
                      {ACTION_ITEM_PRIORITY_CONFIG[p].ja}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 担当者選択 - 将来的にワークスペースメンバーから選択 */}
            <div className={styles.field}>
              <label className={styles.label}>担当者ID</label>
              <input
                type="text"
                className={styles.input}
                value={formData.assigneeUserId}
                onChange={(e) => onChange({ assigneeUserId: e.target.value })}
                placeholder="担当者のユーザーID"
              />
              <span className={styles.hint}>※ 現在は手入力（将来的にメンバー選択に変更）</span>
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
