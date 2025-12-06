/**
 * lib/types/template-variables.ts
 *
 * Phase 14.6-D: 変数プレースホルダー定義
 * Phase 14.62: タグマスタ連携によるバリデーション追加
 *
 * 【責務】
 * - テンプレート変数の定義
 * - 変数のパス・フォールバック設定
 * - 動的変数（日付等）の定義
 * - タグマスタとの連携バリデーション
 */

import { LEAD_INDUSTRY_TAGS, LeadIndustryTag, LEAD_SOURCE_TAGS, LeadSourceTag } from './tag-master';
import { toDisplayValue, MISSING_VALUE_LABELS } from './common';

// ========================================
// 型定義
// ========================================

/**
 * 変数定義
 * Phase 14.62: allowedValues と validate を追加
 */
export interface VariableDefinition {
  /** 変数キー（例: {{顧客名}}） */
  key: string;
  /** 表示名 */
  label: string;
  /** データのパス（例: lead.name） */
  path?: string;
  /** フォールバック値 */
  fallback: string;
  /** フォーマット種別 */
  format?: 'text' | 'currency' | 'date' | 'number' | 'percentage';
  /** 動的変数かどうか */
  isDynamic?: boolean;
  /** 動的変数の値を取得する関数 */
  getValue?: () => string;
  /** カテゴリ */
  category: VariableCategory;
  /** 許可値リスト（タグマスタ連携）- Phase 14.62 追加 */
  allowedValues?: readonly string[];
  /** バリデーション関数 - Phase 14.62 追加 */
  validate?: (value: string) => boolean;
}

/**
 * 変数カテゴリ
 */
export type VariableCategory =
  | 'customer'    // 顧客情報
  | 'deal'        // 商談情報
  | 'company'     // 自社情報
  | 'date'        // 日付
  | 'custom';     // カスタム

// ========================================
// 日付フォーマットヘルパー
// ========================================

/**
 * 日付をフォーマット
 */
function formatDate(date: Date, format: 'full' | 'short' | 'weekday' = 'full'): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];

  switch (format) {
    case 'full':
      return `${year}年${month}月${day}日（${weekday}）`;
    case 'short':
      return `${month}/${day}`;
    case 'weekday':
      return `${month}月${day}日（${weekday}）`;
    default:
      return `${year}年${month}月${day}日`;
  }
}

/**
 * 日付を加算
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 週を加算
 */
function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * 月を加算
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// ========================================
// 変数定義
// ========================================

/**
 * 顧客情報変数
 */
export const CUSTOMER_VARIABLES: VariableDefinition[] = [
  {
    key: '{{顧客名}}',
    label: '顧客名（担当者名）',
    path: 'lead.name',
    fallback: 'お客様',
    format: 'text',
    category: 'customer',
  },
  {
    key: '{{会社名}}',
    label: '会社名',
    path: 'lead.company',
    fallback: '御社',
    format: 'text',
    category: 'customer',
  },
  {
    key: '{{役職}}',
    label: '役職',
    path: 'lead.position',
    fallback: '',
    format: 'text',
    category: 'customer',
  },
  {
    key: '{{部署}}',
    label: '部署',
    path: 'lead.department',
    fallback: '',
    format: 'text',
    category: 'customer',
  },
  {
    key: '{{業種}}',
    label: '業種',
    path: 'lead.industry',
    fallback: '',
    format: 'text',
    category: 'customer',
    // Phase 14.62: タグマスタ連携
    allowedValues: LEAD_INDUSTRY_TAGS,
    validate: (value: string) =>
      value === '' || LEAD_INDUSTRY_TAGS.includes(value as LeadIndustryTag),
  },
  {
    key: '{{メール}}',
    label: 'メールアドレス',
    path: 'lead.email',
    fallback: '',
    format: 'text',
    category: 'customer',
  },
  {
    key: '{{電話}}',
    label: '電話番号',
    path: 'lead.phone',
    fallback: '',
    format: 'text',
    category: 'customer',
  },
];

/**
 * 商談情報変数
 */
export const DEAL_VARIABLES: VariableDefinition[] = [
  {
    key: '{{課題}}',
    label: '顧客の課題',
    path: 'lead.challenge',
    fallback: '課題',
    format: 'text',
    category: 'deal',
  },
  {
    key: '{{ニーズ}}',
    label: '顧客のニーズ',
    path: 'lead.needs',
    fallback: 'ニーズ',
    format: 'text',
    category: 'deal',
  },
  {
    key: '{{提案内容}}',
    label: '提案内容',
    path: 'proposal.summary',
    fallback: '',
    format: 'text',
    category: 'deal',
  },
  {
    key: '{{見積金額}}',
    label: '見積金額',
    path: 'proposal.amount',
    fallback: '',
    format: 'currency',
    category: 'deal',
  },
  {
    key: '{{導入予定日}}',
    label: '導入予定日',
    path: 'proposal.startDate',
    fallback: '',
    format: 'date',
    category: 'deal',
  },
  {
    key: '{{契約期間}}',
    label: '契約期間',
    path: 'proposal.term',
    fallback: '',
    format: 'text',
    category: 'deal',
  },
  {
    key: '{{リードソース}}',
    label: 'リードソース',
    path: 'lead.source',
    fallback: '',
    format: 'text',
    category: 'deal',
    // Phase 14.62: タグマスタ連携
    allowedValues: LEAD_SOURCE_TAGS,
    validate: (value: string) =>
      value === '' || LEAD_SOURCE_TAGS.includes(value as LeadSourceTag),
  },
];

/**
 * 自社情報変数
 */
export const COMPANY_VARIABLES: VariableDefinition[] = [
  {
    key: '{{自社名}}',
    label: '自社名',
    path: 'workspace.companyName',
    fallback: '弊社',
    format: 'text',
    category: 'company',
  },
  {
    key: '{{担当者名}}',
    label: '担当者名（自分）',
    path: 'user.name',
    fallback: '',
    format: 'text',
    category: 'company',
  },
  {
    key: '{{担当者メール}}',
    label: '担当者メールアドレス',
    path: 'user.email',
    fallback: '',
    format: 'text',
    category: 'company',
  },
  {
    key: '{{担当者電話}}',
    label: '担当者電話番号',
    path: 'user.phone',
    fallback: '',
    format: 'text',
    category: 'company',
  },
  {
    key: '{{サービス名}}',
    label: 'サービス名',
    path: 'workspace.serviceName',
    fallback: '弊社サービス',
    format: 'text',
    category: 'company',
  },
];

/**
 * 日付変数
 */
export const DATE_VARIABLES: VariableDefinition[] = [
  {
    key: '{{今日}}',
    label: '今日',
    fallback: '',
    format: 'date',
    isDynamic: true,
    getValue: () => formatDate(new Date()),
    category: 'date',
  },
  {
    key: '{{明日}}',
    label: '明日',
    fallback: '',
    format: 'date',
    isDynamic: true,
    getValue: () => formatDate(addDays(new Date(), 1)),
    category: 'date',
  },
  {
    key: '{{明後日}}',
    label: '明後日',
    fallback: '',
    format: 'date',
    isDynamic: true,
    getValue: () => formatDate(addDays(new Date(), 2)),
    category: 'date',
  },
  {
    key: '{{来週}}',
    label: '来週',
    fallback: '',
    format: 'date',
    isDynamic: true,
    getValue: () => formatDate(addWeeks(new Date(), 1), 'weekday'),
    category: 'date',
  },
  {
    key: '{{来月}}',
    label: '来月',
    fallback: '',
    format: 'date',
    isDynamic: true,
    getValue: () => {
      const nextMonth = addMonths(new Date(), 1);
      return `${nextMonth.getFullYear()}年${nextMonth.getMonth() + 1}月`;
    },
    category: 'date',
  },
  {
    key: '{{今週末}}',
    label: '今週末',
    fallback: '',
    format: 'date',
    isDynamic: true,
    getValue: () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
      return formatDate(addDays(today, daysUntilSaturday), 'weekday');
    },
    category: 'date',
  },
];

/**
 * 全変数
 */
export const ALL_VARIABLES: VariableDefinition[] = [
  ...CUSTOMER_VARIABLES,
  ...DEAL_VARIABLES,
  ...COMPANY_VARIABLES,
  ...DATE_VARIABLES,
];

/**
 * カテゴリ別変数マップ
 */
export const VARIABLES_BY_CATEGORY: Record<VariableCategory, VariableDefinition[]> = {
  customer: CUSTOMER_VARIABLES,
  deal: DEAL_VARIABLES,
  company: COMPANY_VARIABLES,
  date: DATE_VARIABLES,
  custom: [],
};

/**
 * カテゴリのラベル
 */
export const VARIABLE_CATEGORY_LABELS: Record<VariableCategory, string> = {
  customer: '顧客情報',
  deal: '商談情報',
  company: '自社情報',
  date: '日付',
  custom: 'カスタム',
};

// ========================================
// ヘルパー関数
// ========================================

/**
 * 変数キーから定義を取得
 */
export function getVariableDefinition(key: string): VariableDefinition | undefined {
  return ALL_VARIABLES.find((v) => v.key === key);
}

/**
 * テンプレート内の変数を抽出
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{[^}]+\}\}/g;
  const matches = template.match(regex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * 変数が動的かどうか
 */
export function isDynamicVariable(key: string): boolean {
  const definition = getVariableDefinition(key);
  return definition?.isDynamic ?? false;
}

/**
 * 動的変数の値を取得
 */
export function getDynamicVariableValue(key: string): string {
  const definition = getVariableDefinition(key);
  if (definition?.isDynamic && definition.getValue) {
    return definition.getValue();
  }
  return definition?.fallback ?? '';
}

// ========================================
// Phase 14.62: バリデーション関数
// ========================================

/**
 * 変数値を検証
 * Phase 14.62: タグマスタ連携によるバリデーション
 */
export function validateVariableValue(key: string, value: string): boolean {
  const definition = getVariableDefinition(key);
  if (!definition) return false;
  if (!definition.validate) return true; // バリデーション未定義は常にtrue
  return definition.validate(value);
}

/**
 * 変数値をフォーマット（欠損値ポリシー適用）
 * Phase 14.62: common.ts の欠損値ポリシーを適用
 */
export function formatVariableValue(
  key: string,
  value: string | null | undefined
): string {
  const definition = getVariableDefinition(key);
  if (!definition) return toDisplayValue(value);
  return toDisplayValue(value, definition.fallback || MISSING_VALUE_LABELS.notSet);
}

/**
 * 変数の許可値リストを取得
 * Phase 14.62: タグマスタ連携
 */
export function getAllowedValuesForVariable(key: string): readonly string[] | null {
  const definition = getVariableDefinition(key);
  return definition?.allowedValues ?? null;
}
