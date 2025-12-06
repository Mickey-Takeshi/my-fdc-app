/**
 * app/_components/okr/ObjectiveForm.tsx
 *
 * Phase 12: Objective 作成/編集フォーム（モーダル）
 * ActionMapFormModal と同じスタイル
 */

'use client';

import type { ObjectiveScope } from '@/lib/types/okr';
import styles from './FormModal.module.css';

// ========================================
// 型定義
// ========================================

export interface ObjectiveFormData {
  title: string;
  description: string;
  scope: ObjectiveScope;
  periodStart: string;
  periodEnd: string;
  manualRiskFlag: boolean;
  manualRiskReason: string;
}

interface ObjectiveFormProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ObjectiveFormData;
  updateFormData: (data: Partial<ObjectiveFormData>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  isEditing: boolean;
}

// ========================================
// 定数
// ========================================

const SCOPE_OPTIONS: { value: ObjectiveScope; label: string }[] = [
  { value: 'company', label: '会社' },
  { value: 'team', label: 'チーム' },
  { value: 'individual', label: '個人' },
];

// ========================================
// コンポーネント
// ========================================

export function ObjectiveForm({
  isOpen,
  onClose,
  formData,
  updateFormData,
  onSave,
  saving,
  isEditing,
}: ObjectiveFormProps) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? 'Objective を編集' : '新規 Objective 作成'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {/* タイトル */}
            <div className={styles.field}>
              <label className={styles.label}>
                タイトル <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="例: Q1 売上目標 1000万円達成"
                maxLength={100}
                required
                autoFocus
              />
              <span className={styles.hint}>{formData.title.length}/100</span>
            </div>

            {/* 説明 */}
            <div className={styles.field}>
              <label className={styles.label}>説明</label>
              <textarea
                className={styles.textarea}
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="この Objective の目的や背景を記述..."
                maxLength={1000}
                rows={3}
              />
              <span className={styles.hint}>{formData.description.length}/1000</span>
            </div>

            {/* スコープ */}
            <div className={styles.field}>
              <label className={styles.label}>
                スコープ <span className={styles.required}>*</span>
              </label>
              <div className={styles.scopeButtons}>
                {SCOPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateFormData({ scope: option.value })}
                    className={`${styles.scopeButton} ${
                      formData.scope === option.value ? styles.scopeButtonActive : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 期間 */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>開始日</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.periodStart}
                  onChange={(e) => updateFormData({ periodStart: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>終了日</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.periodEnd}
                  onChange={(e) => updateFormData({ periodEnd: e.target.value })}
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

export default ObjectiveForm;
