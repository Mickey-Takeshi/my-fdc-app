/**
 * lib/types/common.ts
 *
 * Phase 14.62: 共通定義
 *
 * 【責務】
 * - 欠損値ポリシー
 * - 優先度の統一定義
 * - 共通ユーティリティ型
 */

// ========================================
// 欠損値ポリシー
// ========================================

/**
 * 欠損値の種別
 * - notSet: 未設定（ユーザーが入力していない）
 * - notApplicable: 該当なし（その概念が適用されない）
 * - exited: 離脱（プロセスから外れた）
 */
export type MissingValueType = 'notSet' | 'notApplicable' | 'exited';

/**
 * 欠損値の表示テキスト
 */
export const MISSING_VALUE_LABELS: Record<MissingValueType, string> = {
  notSet: '（未設定）',
  notApplicable: '（該当なし）',
  exited: '（離脱）',
};

/**
 * 欠損値かどうかを判定
 */
export function isMissingValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/**
 * 欠損値を表示用テキストに変換
 */
export function toDisplayValue(
  value: string | null | undefined,
  fallback: string = MISSING_VALUE_LABELS.notSet
): string {
  return isMissingValue(value) ? fallback : value!;
}

// ========================================
// 優先度の統一定義
// ========================================

/**
 * 優先度レベル（数値）
 */
export type PriorityLevel = 1 | 2 | 3 | 4;

/**
 * 優先度ラベル
 */
export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  1: '最優先',
  2: '高',
  3: '中',
  4: '低',
};

/**
 * 優先度ラベルから数値を取得
 */
export function getPriorityFromLabel(label: string): PriorityLevel | null {
  const entry = Object.entries(PRIORITY_LABELS).find(([, v]) => v === label);
  return entry ? (Number(entry[0]) as PriorityLevel) : null;
}

/**
 * 数値から優先度ラベルを取得
 */
export function getPriorityLabel(priority: PriorityLevel): string {
  return PRIORITY_LABELS[priority];
}

/**
 * 優先度の選択肢を取得
 */
export function getPriorityOptions(): Array<{ value: PriorityLevel; label: string }> {
  return (Object.entries(PRIORITY_LABELS) as [string, string][]).map(([k, v]) => ({
    value: Number(k) as PriorityLevel,
    label: v,
  }));
}
