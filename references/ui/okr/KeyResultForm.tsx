/**
 * app/_components/okr/KeyResultForm.tsx
 *
 * Phase 12: Key Result 作成/編集フォーム（モーダル）
 * ActionMapFormModal と同じスタイル
 */

'use client';

import type { KRCalcMethod } from '@/lib/types/okr';
import styles from './FormModal.module.css';

// ========================================
// 型定義
// ========================================

export interface KeyResultFormData {
  title: string;
  targetValue: string;
  currentValue: string;
  unit: string;
  isQualitative: boolean;
  calcMethod: KRCalcMethod;
}

interface KeyResultFormProps {
  isOpen: boolean;
  onClose: () => void;
  formData: KeyResultFormData;
  updateFormData: (data: Partial<KeyResultFormData>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  isEditing: boolean;
}

// ========================================
// 定数
// ========================================

const CALC_METHOD_OPTIONS: { value: KRCalcMethod; label: string }[] = [
  { value: 'manual', label: '手動入力' },
  { value: 'fromActionMaps', label: 'Action Map連動' },
];

// ========================================
// コンポーネント
// ========================================

export function KeyResultForm({
  isOpen,
  onClose,
  formData,
  updateFormData,
  onSave,
  saving,
  isEditing,
}: KeyResultFormProps) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  const showNumericFields = !formData.isQualitative && formData.calcMethod !== 'fromActionMaps';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? 'Key Result を編集' : '新規 Key Result 作成'}
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
                placeholder="例: 新規リード 50件獲得"
                maxLength={100}
                required
                autoFocus
              />
              <span className={styles.hint}>{formData.title.length}/100</span>
            </div>

            {/* 定性/定量 */}
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isQualitative}
                  onChange={(e) => updateFormData({ isQualitative: e.target.checked })}
                />
                <span>定性的KR（数値目標なし）</span>
              </label>
              <span className={styles.hint}>
                達成/未達成で評価する場合はチェック
              </span>
            </div>

            {/* 計算方法 */}
            <div className={styles.field}>
              <label className={styles.label}>進捗計算方法</label>
              <div className={styles.scopeButtons}>
                {CALC_METHOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateFormData({ calcMethod: option.value })}
                    className={`${styles.scopeButton} ${
                      formData.calcMethod === option.value ? styles.scopeButtonActive : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 数値フィールド（定量的かつAction Map連動以外の場合のみ表示） */}
            {showNumericFields && (
              <>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>目標値</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={formData.targetValue}
                      onChange={(e) => updateFormData({ targetValue: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>現在値</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={formData.currentValue}
                      onChange={(e) => updateFormData({ currentValue: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>単位</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.unit}
                    onChange={(e) => updateFormData({ unit: e.target.value })}
                    placeholder="件、%、人 など"
                  />
                </div>
              </>
            )}

            {/* Action Map連動の場合の説明 */}
            {formData.calcMethod === 'fromActionMaps' && (
              <div className={styles.infoBox}>
                作成後、Key Result詳細画面からAction Mapをリンクできます。
                リンクしたAction Mapの進捗率の平均がKRの進捗率になります。
              </div>
            )}
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

export default KeyResultForm;
