/**
 * lib/types/template-categories.ts
 *
 * Phase 14.6-D: テンプレートカテゴリ定義
 *
 * 【責務】
 * - テンプレートのカテゴリ定義
 * - 営業フェーズ別テンプレート分類
 * - テンプレートメタデータ
 */

// ========================================
// 型定義
// ========================================

/**
 * テンプレートカテゴリ
 */
export type TemplateCategory =
  | 'initial_contact'   // 初回コンタクト
  | 'follow_up'         // フォローアップ
  | 'proposal'          // 提案・見積
  | 'negotiation'       // 交渉・クロージング
  | 'onboarding'        // オンボーディング
  | 'account_mgmt'      // 顧客管理
  | 'thank_you'         // お礼
  | 'apology'           // お詫び
  | 'announcement'      // お知らせ
  | 'report'            // レポート
  | 'other';            // その他

/**
 * カテゴリ情報
 */
export interface CategoryInfo {
  id: TemplateCategory;
  label: string;
  description: string;
  icon: string;
  salesPhase?: string;
  order: number;
}

/**
 * テンプレート
 */
export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  content: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

// ========================================
// カテゴリ定義
// ========================================

/**
 * テンプレートカテゴリ一覧
 */
export const TEMPLATE_CATEGORIES: CategoryInfo[] = [
  {
    id: 'initial_contact',
    label: '初回コンタクト',
    description: '新規見込み客への最初のアプローチ',
    icon: '👋',
    salesPhase: 'new',
    order: 1,
  },
  {
    id: 'follow_up',
    label: 'フォローアップ',
    description: '商談後のフォローや状況確認',
    icon: '🔄',
    salesPhase: 'contacted',
    order: 2,
  },
  {
    id: 'proposal',
    label: '提案・見積',
    description: '提案書送付や見積もり案内',
    icon: '📋',
    salesPhase: 'qualified',
    order: 3,
  },
  {
    id: 'negotiation',
    label: '交渉・クロージング',
    description: '価格交渉や契約締結',
    icon: '🤝',
    salesPhase: 'negotiation',
    order: 4,
  },
  {
    id: 'onboarding',
    label: 'オンボーディング',
    description: '契約後の導入サポート',
    icon: '🚀',
    salesPhase: 'won',
    order: 5,
  },
  {
    id: 'account_mgmt',
    label: '顧客管理',
    description: '既存顧客への定期連絡',
    icon: '💼',
    salesPhase: undefined,
    order: 6,
  },
  {
    id: 'thank_you',
    label: 'お礼',
    description: '面談後や契約後のお礼',
    icon: '🙏',
    salesPhase: undefined,
    order: 7,
  },
  {
    id: 'apology',
    label: 'お詫び',
    description: '不具合や遅延のお詫び',
    icon: '🙇',
    salesPhase: undefined,
    order: 8,
  },
  {
    id: 'announcement',
    label: 'お知らせ',
    description: '新機能や価格改定の案内',
    icon: '📢',
    salesPhase: undefined,
    order: 9,
  },
  {
    id: 'report',
    label: 'レポート',
    description: '週報や月報のテンプレート',
    icon: '📊',
    salesPhase: undefined,
    order: 10,
  },
  {
    id: 'other',
    label: 'その他',
    description: '分類されないテンプレート',
    icon: '📝',
    salesPhase: undefined,
    order: 99,
  },
];

/**
 * カテゴリIDからカテゴリ情報を取得
 */
export function getCategoryInfo(categoryId: TemplateCategory): CategoryInfo | undefined {
  return TEMPLATE_CATEGORIES.find((c) => c.id === categoryId);
}

/**
 * 営業フェーズからカテゴリを取得
 */
export function getCategoriesBySalesPhase(salesPhase: string): CategoryInfo[] {
  return TEMPLATE_CATEGORIES.filter((c) => c.salesPhase === salesPhase);
}

// ========================================
// デフォルトテンプレート
// ========================================

/**
 * デフォルトテンプレート一覧
 */
export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  // 初回コンタクト
  {
    id: 'default-initial-1',
    name: '初回コンタクト（Web問合せ）',
    category: 'initial_contact',
    content: `{{会社名}} {{顧客名}}様

お世話になっております。
{{自社名}}の{{担当者名}}です。

先日はWebサイトよりお問い合わせいただき、誠にありがとうございます。

{{課題}}について、ぜひ詳しくお話をお聞かせいただければと思います。
{{来週}}あたりで30分ほどお時間いただけますでしょうか？

ご都合の良い日時をいくつかお知らせいただけますと幸いです。

どうぞよろしくお願いいたします。`,
    description: 'Webからの問合せに対する初回コンタクト',
    tags: ['Web問合せ', '初回'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-initial-2',
    name: '初回コンタクト（紹介）',
    category: 'initial_contact',
    content: `{{会社名}} {{顧客名}}様

はじめまして。
{{自社名}}の{{担当者名}}と申します。

このたびは〇〇様よりご紹介いただき、ご連絡させていただきました。

{{サービス名}}は{{課題}}でお困りの企業様にご好評いただいております。
もしご興味がございましたら、一度詳しいご説明をさせていただければ幸いです。

ご都合のよろしい日時をお知らせいただけますでしょうか。

何卒よろしくお願いいたします。`,
    description: '紹介経由の初回コンタクト',
    tags: ['紹介', '初回'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // フォローアップ
  {
    id: 'default-followup-1',
    name: 'フォローアップ（商談後）',
    category: 'follow_up',
    content: `{{顧客名}}様

先日はお忙しい中、お時間をいただきありがとうございました。

{{提案内容}}について、ご検討状況はいかがでしょうか？
ご不明点やご質問がございましたら、お気軽にお申し付けください。

追加の資料や事例のご紹介も可能ですので、ご希望がございましたらお知らせください。

引き続きどうぞよろしくお願いいたします。`,
    description: '商談後のフォローアップ',
    tags: ['フォローアップ', '商談後'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-followup-2',
    name: 'フォローアップ（長期）',
    category: 'follow_up',
    content: `{{顧客名}}様

ご無沙汰しております。
{{自社名}}の{{担当者名}}です。

以前ご検討いただいておりました{{提案内容}}について、その後のご状況はいかがでしょうか。

最近、{{サービス名}}に新機能が追加されましたので、もしご興味がございましたら改めてご説明させていただければと存じます。

お忙しいところ恐れ入りますが、ご都合のよろしい時にご連絡いただけますと幸いです。`,
    description: '長期フォローアップ',
    tags: ['フォローアップ', '長期'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 提案・見積
  {
    id: 'default-proposal-1',
    name: '提案書送付',
    category: 'proposal',
    content: `{{会社名}} {{顧客名}}様

お世話になっております。
{{自社名}}の{{担当者名}}です。

先日ご依頼いただきました{{提案内容}}について、ご提案書を作成いたしました。
添付ファイルにてご確認ください。

【ご提案概要】
・対象：{{課題}}の解決
・金額：{{見積金額}}（税別）
・導入予定：{{導入予定日}}

ご不明点やご質問がございましたら、お気軽にお問い合わせください。
ご検討のほど、何卒よろしくお願いいたします。`,
    description: '提案書・見積書の送付',
    tags: ['提案', '見積'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // お礼
  {
    id: 'default-thankyou-1',
    name: 'お礼（面談後）',
    category: 'thank_you',
    content: `{{顧客名}}様

本日はお忙しい中、お時間をいただきありがとうございました。

{{課題}}についてお話をお聞かせいただき、大変参考になりました。
{{提案内容}}で{{会社名}}様のお役に立てるよう、精一杯対応させていただきます。

次回のお打ち合わせは{{来週}}を予定しております。
ご都合に変更がございましたら、お知らせください。

引き続きどうぞよろしくお願いいたします。`,
    description: '面談後のお礼メール',
    tags: ['お礼', '面談後'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-thankyou-2',
    name: 'お礼（契約後）',
    category: 'thank_you',
    content: `{{会社名}} {{顧客名}}様

このたびは{{サービス名}}をご契約いただき、誠にありがとうございます。

{{担当者名}}が担当として、導入から運用まで全力でサポートさせていただきます。

今後のスケジュール:
・{{導入予定日}}：サービス開始
・初期設定のサポート
・ご利用開始後のフォローアップ

ご不明点がございましたら、いつでもお気軽にご連絡ください。

今後ともどうぞよろしくお願いいたします。`,
    description: '契約後のお礼メール',
    tags: ['お礼', '契約後'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ========================================
// ヘルパー関数
// ========================================

/**
 * カテゴリでテンプレートをフィルタ
 */
export function filterTemplatesByCategory(
  templates: MessageTemplate[],
  category: TemplateCategory
): MessageTemplate[] {
  return templates.filter((t) => t.category === category);
}

/**
 * テンプレートを検索
 */
export function searchTemplates(
  templates: MessageTemplate[],
  query: string
): MessageTemplate[] {
  const lowerQuery = query.toLowerCase();
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.content.toLowerCase().includes(lowerQuery) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * デフォルトテンプレートを取得（カテゴリ指定）
 */
export function getDefaultTemplates(category?: TemplateCategory): MessageTemplate[] {
  if (category) {
    return DEFAULT_TEMPLATES.filter((t) => t.category === category);
  }
  return DEFAULT_TEMPLATES;
}
