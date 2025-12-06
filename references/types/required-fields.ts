/**
 * lib/types/required-fields.ts
 *
 * Phase 14.6-B: 必須フィールド定義
 *
 * 【責務】
 * - AI参照時の必須フィールド定義
 * - フィールド欠損時のフォールバック値
 * - データ品質スコア算出用重み
 */

// ========================================
// 型定義
// ========================================

/**
 * フィールド定義
 */
export interface FieldDefinition {
  /** フィールドキー */
  key: string;
  /** 表示名 */
  label: string;
  /** 必須かどうか */
  required: boolean;
  /** AI参照時に必要か */
  aiRequired: boolean;
  /** フォールバック値 */
  fallback: string | number | null;
  /** データ品質スコアの重み（0-1） */
  qualityWeight: number;
  /** バリデーション関数 */
  validate?: (value: unknown) => boolean;
}

/**
 * エンティティのフィールド定義マップ
 */
export type FieldDefinitionMap = Record<string, FieldDefinition>;

// ========================================
// 見込み客（Lead）必須フィールド
// ========================================

export const LEAD_REQUIRED_FIELDS: FieldDefinitionMap = {
  name: {
    key: 'name',
    label: '担当者名',
    required: true,
    aiRequired: true,
    fallback: '（氏名不明）',
    qualityWeight: 0.15,
    validate: (v) => typeof v === 'string' && v.trim().length > 0,
  },
  company: {
    key: 'company',
    label: '会社名',
    required: true,
    aiRequired: true,
    fallback: '（会社名不明）',
    qualityWeight: 0.15,
    validate: (v) => typeof v === 'string' && v.trim().length > 0,
  },
  email: {
    key: 'email',
    label: 'メールアドレス',
    required: false,
    aiRequired: false,
    fallback: null,
    qualityWeight: 0.1,
    validate: (v) =>
      typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  },
  phone: {
    key: 'phone',
    label: '電話番号',
    required: false,
    aiRequired: false,
    fallback: null,
    qualityWeight: 0.05,
  },
  status: {
    key: 'status',
    label: 'ステータス',
    required: true,
    aiRequired: true,
    fallback: 'new',
    qualityWeight: 0.1,
  },
  source: {
    key: 'source',
    label: 'リードソース',
    required: false,
    aiRequired: true,
    fallback: '不明',
    qualityWeight: 0.1,
  },
  industry: {
    key: 'industry',
    label: '業種',
    required: false,
    aiRequired: true,
    fallback: '不明',
    qualityWeight: 0.1,
  },
  companySize: {
    key: 'companySize',
    label: '会社規模',
    required: false,
    aiRequired: false,
    fallback: null,
    qualityWeight: 0.05,
  },
  budget: {
    key: 'budget',
    label: '予算',
    required: false,
    aiRequired: true,
    fallback: '未定',
    qualityWeight: 0.1,
  },
  urgency: {
    key: 'urgency',
    label: '緊急度',
    required: false,
    aiRequired: true,
    fallback: '不明',
    qualityWeight: 0.05,
  },
  notes: {
    key: 'notes',
    label: '備考・メモ',
    required: false,
    aiRequired: true,
    fallback: '',
    qualityWeight: 0.05,
  },
};

// ========================================
// 既存客（Client）必須フィールド
// ========================================

export const CLIENT_REQUIRED_FIELDS: FieldDefinitionMap = {
  name: {
    key: 'name',
    label: '担当者名',
    required: true,
    aiRequired: true,
    fallback: '（氏名不明）',
    qualityWeight: 0.15,
    validate: (v) => typeof v === 'string' && v.trim().length > 0,
  },
  company: {
    key: 'company',
    label: '会社名',
    required: true,
    aiRequired: true,
    fallback: '（会社名不明）',
    qualityWeight: 0.15,
    validate: (v) => typeof v === 'string' && v.trim().length > 0,
  },
  email: {
    key: 'email',
    label: 'メールアドレス',
    required: false,
    aiRequired: false,
    fallback: null,
    qualityWeight: 0.1,
  },
  phone: {
    key: 'phone',
    label: '電話番号',
    required: false,
    aiRequired: false,
    fallback: null,
    qualityWeight: 0.05,
  },
  status: {
    key: 'status',
    label: 'ステータス',
    required: true,
    aiRequired: true,
    fallback: 'active',
    qualityWeight: 0.1,
  },
  contractType: {
    key: 'contractType',
    label: '契約種別',
    required: false,
    aiRequired: true,
    fallback: '不明',
    qualityWeight: 0.1,
  },
  contractValue: {
    key: 'contractValue',
    label: '契約金額',
    required: false,
    aiRequired: true,
    fallback: 0,
    qualityWeight: 0.1,
  },
  contractStartDate: {
    key: 'contractStartDate',
    label: '契約開始日',
    required: false,
    aiRequired: false,
    fallback: null,
    qualityWeight: 0.05,
  },
  contractEndDate: {
    key: 'contractEndDate',
    label: '契約終了日',
    required: false,
    aiRequired: true,
    fallback: null,
    qualityWeight: 0.1,
  },
  satisfaction: {
    key: 'satisfaction',
    label: '満足度',
    required: false,
    aiRequired: true,
    fallback: '不明',
    qualityWeight: 0.05,
  },
  notes: {
    key: 'notes',
    label: '備考・メモ',
    required: false,
    aiRequired: true,
    fallback: '',
    qualityWeight: 0.05,
  },
};

// ========================================
// タスク（Task）必須フィールド
// ========================================

export const TASK_REQUIRED_FIELDS: FieldDefinitionMap = {
  title: {
    key: 'title',
    label: 'タイトル',
    required: true,
    aiRequired: true,
    fallback: '（タイトル未設定）',
    qualityWeight: 0.3,
    validate: (v) => typeof v === 'string' && v.trim().length > 0,
  },
  status: {
    key: 'status',
    label: 'ステータス',
    required: true,
    aiRequired: true,
    fallback: 'pending',
    qualityWeight: 0.2,
  },
  priority: {
    key: 'priority',
    label: '優先度',
    required: false,
    aiRequired: true,
    fallback: '中',
    qualityWeight: 0.15,
  },
  dueDate: {
    key: 'dueDate',
    label: '期限',
    required: false,
    aiRequired: true,
    fallback: null,
    qualityWeight: 0.15,
  },
  assignee: {
    key: 'assignee',
    label: '担当者',
    required: false,
    aiRequired: false,
    fallback: null,
    qualityWeight: 0.1,
  },
  description: {
    key: 'description',
    label: '説明',
    required: false,
    aiRequired: false,
    fallback: '',
    qualityWeight: 0.1,
  },
};

// ========================================
// 統合フィールドマスタ
// ========================================

export const REQUIRED_FIELDS = {
  lead: LEAD_REQUIRED_FIELDS,
  client: CLIENT_REQUIRED_FIELDS,
  task: TASK_REQUIRED_FIELDS,
} as const;

export type EntityType = keyof typeof REQUIRED_FIELDS;

// ========================================
// データ品質チェックヘルパー
// ========================================

/**
 * データ品質スコアを算出
 * @returns 0-100のスコア
 */
export function calculateDataQualityScore(
  data: Record<string, unknown>,
  entityType: EntityType
): number {
  const fields = REQUIRED_FIELDS[entityType];
  let totalWeight = 0;
  let filledWeight = 0;

  for (const field of Object.values(fields)) {
    totalWeight += field.qualityWeight;

    const value = data[field.key];
    const isFilled = value !== null && value !== undefined && value !== '';

    // バリデーション関数がある場合は実行
    if (isFilled && field.validate) {
      if (field.validate(value)) {
        filledWeight += field.qualityWeight;
      }
    } else if (isFilled) {
      filledWeight += field.qualityWeight;
    }
  }

  return totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;
}

/**
 * 欠損フィールドを取得
 */
export function getMissingFields(
  data: Record<string, unknown>,
  entityType: EntityType,
  aiRequiredOnly: boolean = false
): FieldDefinition[] {
  const fields = REQUIRED_FIELDS[entityType];
  const missing: FieldDefinition[] = [];

  for (const field of Object.values(fields)) {
    if (aiRequiredOnly && !field.aiRequired) continue;

    const value = data[field.key];
    const isFilled = value !== null && value !== undefined && value !== '';

    if (!isFilled) {
      missing.push(field);
    }
  }

  return missing;
}

/**
 * フォールバック値を適用
 */
export function applyFallbacks(
  data: Record<string, unknown>,
  entityType: EntityType
): Record<string, unknown> {
  const fields = REQUIRED_FIELDS[entityType];
  const result = { ...data };

  for (const field of Object.values(fields)) {
    const value = result[field.key];
    const isFilled = value !== null && value !== undefined && value !== '';

    if (!isFilled && field.fallback !== null) {
      result[field.key] = field.fallback;
    }
  }

  return result;
}

/**
 * AI参照用のデータを準備（フォールバック適用済み）
 */
export function prepareDataForAI(
  data: Record<string, unknown>,
  entityType: EntityType
): Record<string, unknown> {
  const fields = REQUIRED_FIELDS[entityType];
  const result: Record<string, unknown> = {};

  for (const field of Object.values(fields)) {
    if (!field.aiRequired) continue;

    const value = data[field.key];
    const isFilled = value !== null && value !== undefined && value !== '';

    result[field.key] = isFilled ? value : field.fallback;
  }

  return result;
}

/**
 * データ品質レポートを生成
 */
export function generateQualityReport(
  data: Record<string, unknown>,
  entityType: EntityType
): {
  score: number;
  filledCount: number;
  totalCount: number;
  missingRequired: FieldDefinition[];
  missingOptional: FieldDefinition[];
  suggestions: string[];
} {
  const fields = REQUIRED_FIELDS[entityType];
  const score = calculateDataQualityScore(data, entityType);
  const missing = getMissingFields(data, entityType);

  const missingRequired = missing.filter((f) => f.required);
  const missingOptional = missing.filter((f) => !f.required);

  const filledCount = Object.values(fields).length - missing.length;
  const totalCount = Object.values(fields).length;

  const suggestions: string[] = [];

  if (missingRequired.length > 0) {
    suggestions.push(
      `必須項目（${missingRequired.map((f) => f.label).join('、')}）を入力してください`
    );
  }

  if (score < 50) {
    suggestions.push('データ品質を向上させるため、より多くの情報を入力してください');
  }

  const aiMissing = missing.filter((f) => f.aiRequired);
  if (aiMissing.length > 0) {
    suggestions.push(
      `AI分析の精度向上のため、${aiMissing.map((f) => f.label).join('、')}の入力を推奨します`
    );
  }

  return {
    score,
    filledCount,
    totalCount,
    missingRequired,
    missingOptional,
    suggestions,
  };
}
