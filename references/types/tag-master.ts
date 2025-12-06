/**
 * lib/types/tag-master.ts
 *
 * Phase 14.6-B: タグマスタ定義
 * Phase 14.62: 概念重複の解消（CLIENT_USAGE_STATUS_TAGS, TASK_PRIORITY_TAGS 廃止）
 *
 * 【責務】
 * - 見込み客・既存客・タスクのタグカテゴリ定義
 * - タグの標準化・正規化
 * - AI参照時のデータ品質向上
 *
 * 【Phase 14.62 変更点】
 * - CLIENT_USAGE_STATUS_TAGS → CLIENT_ATTRIBUTE_TAGS に変更（ステータスと責務分離）
 * - TASK_PRIORITY_TAGS → 廃止（common.ts の PRIORITY_LABELS を使用）
 */

import { PriorityLevel, PRIORITY_LABELS } from './common';

// ========================================
// 見込み客（Lead）タグ
// ========================================

/**
 * 業種タグ
 */
export const LEAD_INDUSTRY_TAGS = [
  'IT・通信',
  'SaaS・クラウド',
  '製造業',
  '金融・保険',
  '不動産',
  '小売・EC',
  '医療・ヘルスケア',
  'コンサルティング',
  '教育・研修',
  '人材・HR',
  '広告・マーケティング',
  '物流・運輸',
  '建設・土木',
  'エネルギー',
  '飲食・フード',
  'その他',
] as const;

export type LeadIndustryTag = (typeof LEAD_INDUSTRY_TAGS)[number];

/**
 * 会社規模タグ
 */
export const LEAD_COMPANY_SIZE_TAGS = [
  '1-10名',
  '11-50名',
  '51-200名',
  '201-500名',
  '501-1000名',
  '1001名以上',
] as const;

export type LeadCompanySizeTag = (typeof LEAD_COMPANY_SIZE_TAGS)[number];

/**
 * リードソースタグ
 */
export const LEAD_SOURCE_TAGS = [
  'Web問合せ',
  '紹介',
  '展示会・イベント',
  'セミナー・ウェビナー',
  'Web広告',
  'SNS',
  'テレアポ',
  'コールドメール',
  '既存顧客からの紹介',
  'パートナー経由',
  'その他',
] as const;

export type LeadSourceTag = (typeof LEAD_SOURCE_TAGS)[number];

/**
 * 緊急度タグ
 */
export const LEAD_URGENCY_TAGS = [
  '即時（1ヶ月以内）',
  '短期（3ヶ月以内）',
  '中期（6ヶ月以内）',
  '長期（1年以内）',
  '情報収集のみ',
] as const;

export type LeadUrgencyTag = (typeof LEAD_URGENCY_TAGS)[number];

/**
 * 予算規模タグ
 */
export const LEAD_BUDGET_TAGS = [
  '〜50万円',
  '50万〜100万円',
  '100万〜300万円',
  '300万〜500万円',
  '500万〜1000万円',
  '1000万円以上',
  '未定・不明',
] as const;

export type LeadBudgetTag = (typeof LEAD_BUDGET_TAGS)[number];

/**
 * 見込み客タグカテゴリ
 */
export const LEAD_TAG_CATEGORIES = {
  industry: {
    label: '業種',
    tags: LEAD_INDUSTRY_TAGS,
    multiple: false,
    required: false,
  },
  companySize: {
    label: '会社規模',
    tags: LEAD_COMPANY_SIZE_TAGS,
    multiple: false,
    required: false,
  },
  source: {
    label: 'リードソース',
    tags: LEAD_SOURCE_TAGS,
    multiple: false,
    required: true,
  },
  urgency: {
    label: '緊急度',
    tags: LEAD_URGENCY_TAGS,
    multiple: false,
    required: false,
  },
  budget: {
    label: '予算規模',
    tags: LEAD_BUDGET_TAGS,
    multiple: false,
    required: false,
  },
} as const;

// ========================================
// 既存客（Client）タグ
// ========================================

/**
 * 契約種別タグ
 */
export const CLIENT_CONTRACT_TYPE_TAGS = [
  '月額契約',
  '年額契約',
  'スポット',
  'エンタープライズ',
  'トライアル',
] as const;

export type ClientContractTypeTag = (typeof CLIENT_CONTRACT_TYPE_TAGS)[number];

/**
 * 顧客属性タグ
 * Phase 14.62: CLIENT_USAGE_STATUS_TAGS を廃止し、ステータスと重複しない属性タグに変更
 *
 * 【変更理由】
 * - 旧 CLIENT_USAGE_STATUS_TAGS（アクティブ, 休眠, 解約予定 等）は CLIENT_STATUSES と概念重複
 * - AIが両方を参照した際に「アクティブ」の定義が曖昧になるリスク
 * - タグは「付加情報」、ステータスは「状態遷移」という責務分離を明確化
 */
export const CLIENT_ATTRIBUTE_TAGS = [
  '優良顧客',
  'VIP',
  '支払い遅延あり',
  '紹介元',
  '事例掲載可',
] as const;

export type ClientAttributeTag = (typeof CLIENT_ATTRIBUTE_TAGS)[number];

/**
 * @deprecated Phase 14.62 で廃止。CLIENT_ATTRIBUTE_TAGS を使用してください。
 * ステータス管理は CLIENT_STATUSES（status-master.ts）を使用してください。
 */
export const CLIENT_USAGE_STATUS_TAGS = CLIENT_ATTRIBUTE_TAGS;
export type ClientUsageStatusTag = ClientAttributeTag;

/**
 * 満足度タグ
 */
export const CLIENT_SATISFACTION_TAGS = [
  '高（推奨者）',
  '中（中立）',
  '低（批判者）',
  '要フォロー',
] as const;

export type ClientSatisfactionTag = (typeof CLIENT_SATISFACTION_TAGS)[number];

/**
 * 契約更新タグ
 */
export const CLIENT_RENEWAL_TAGS = [
  '更新確定',
  '更新予定',
  '交渉中',
  '更新リスク',
  '解約確定',
] as const;

export type ClientRenewalTag = (typeof CLIENT_RENEWAL_TAGS)[number];

/**
 * 既存客タグカテゴリ
 * Phase 14.62: usageStatus を attribute に変更
 */
export const CLIENT_TAG_CATEGORIES = {
  contractType: {
    label: '契約種別',
    tags: CLIENT_CONTRACT_TYPE_TAGS,
    multiple: false,
    required: true,
  },
  attribute: {
    label: '顧客属性',
    tags: CLIENT_ATTRIBUTE_TAGS,
    multiple: true, // 複数選択可能
    required: false,
  },
  satisfaction: {
    label: '満足度',
    tags: CLIENT_SATISFACTION_TAGS,
    multiple: false,
    required: false,
  },
  renewal: {
    label: '契約更新',
    tags: CLIENT_RENEWAL_TAGS,
    multiple: false,
    required: false,
  },
} as const;

// ========================================
// タスク（Task）タグ
// ========================================

/**
 * タスク種別タグ
 */
export const TASK_TYPE_TAGS = [
  '営業活動',
  '顧客対応',
  '資料作成',
  'ミーティング',
  '管理業務',
  '学習・研修',
  'その他',
] as const;

export type TaskTypeTag = (typeof TASK_TYPE_TAGS)[number];

/**
 * タスクタグカテゴリ
 * Phase 14.62: priority を削除（common.ts の PRIORITY_LABELS を使用）
 */
export const TASK_TAG_CATEGORIES = {
  type: {
    label: '種別',
    tags: TASK_TYPE_TAGS,
    multiple: true,
    required: false,
  },
} as const;

/**
 * @deprecated Phase 14.62 で廃止。common.ts の PRIORITY_LABELS を使用してください。
 */
export const TASK_PRIORITY_TAGS = Object.values(PRIORITY_LABELS) as readonly string[];
export type TaskPriorityTag = string;

/**
 * 優先度の選択肢を取得（共通定義から）
 * Phase 14.62: Single Source of Truth を common.ts に統一
 */
export function getTaskPriorityOptions(): Array<{ value: PriorityLevel; label: string }> {
  return (Object.entries(PRIORITY_LABELS) as [string, string][]).map(([k, v]) => ({
    value: Number(k) as PriorityLevel,
    label: v,
  }));
}

// ========================================
// 統合タグマスタ
// ========================================

/**
 * 全タグカテゴリ
 */
export const TAG_CATEGORIES = {
  lead: LEAD_TAG_CATEGORIES,
  client: CLIENT_TAG_CATEGORIES,
  task: TASK_TAG_CATEGORIES,
} as const;

export type TagCategory = keyof typeof TAG_CATEGORIES;

// ========================================
// タグ正規化ヘルパー
// ========================================

/**
 * タグを正規化（類似タグの統合）
 */
export function normalizeTag(tag: string, _category: string): string {
  const normalized = tag.trim();

  // 類似タグのマッピング
  const TAG_NORMALIZATION_MAP: Record<string, string> = {
    // 業種の表記揺れ
    'IT': 'IT・通信',
    'IT業': 'IT・通信',
    'テック': 'IT・通信',
    'SaaS': 'SaaS・クラウド',
    'クラウド': 'SaaS・クラウド',
    '金融': '金融・保険',
    '銀行': '金融・保険',
    '保険': '金融・保険',
    '製造': '製造業',
    'メーカー': '製造業',
    '不動産': '不動産',
    '小売': '小売・EC',
    'EC': '小売・EC',
    'Eコマース': '小売・EC',
    // リードソースの表記揺れ
    'ウェブ': 'Web問合せ',
    'ホームページ': 'Web問合せ',
    'HP': 'Web問合せ',
    '紹介': '紹介',
    'リファラル': '紹介',
    '展示会': '展示会・イベント',
    'イベント': '展示会・イベント',
    'セミナー': 'セミナー・ウェビナー',
    'ウェビナー': 'セミナー・ウェビナー',
    '広告': 'Web広告',
  };

  return TAG_NORMALIZATION_MAP[normalized] || normalized;
}

/**
 * タグカテゴリ型
 */
type LeadTagCategoryKey = keyof typeof LEAD_TAG_CATEGORIES;
type ClientTagCategoryKey = keyof typeof CLIENT_TAG_CATEGORIES;
type TaskTagCategoryKey = keyof typeof TASK_TAG_CATEGORIES;

/**
 * タグが有効かチェック
 */
export function isValidTag(
  tag: string,
  entityType: 'lead' | 'client' | 'task',
  categoryKey: string
): boolean {
  let validTags: readonly string[] = [];

  if (entityType === 'lead') {
    const category = LEAD_TAG_CATEGORIES[categoryKey as LeadTagCategoryKey];
    if (category) validTags = category.tags;
  } else if (entityType === 'client') {
    const category = CLIENT_TAG_CATEGORIES[categoryKey as ClientTagCategoryKey];
    if (category) validTags = category.tags;
  } else if (entityType === 'task') {
    const category = TASK_TAG_CATEGORIES[categoryKey as TaskTagCategoryKey];
    if (category) validTags = category.tags;
  }

  return validTags.includes(tag);
}

/**
 * カテゴリの有効なタグ一覧を取得
 */
export function getValidTags(
  entityType: 'lead' | 'client' | 'task',
  categoryKey: string
): readonly string[] {
  if (entityType === 'lead') {
    const category = LEAD_TAG_CATEGORIES[categoryKey as LeadTagCategoryKey];
    return category?.tags || [];
  } else if (entityType === 'client') {
    const category = CLIENT_TAG_CATEGORIES[categoryKey as ClientTagCategoryKey];
    return category?.tags || [];
  } else if (entityType === 'task') {
    const category = TASK_TAG_CATEGORIES[categoryKey as TaskTagCategoryKey];
    return category?.tags || [];
  }

  return [];
}
