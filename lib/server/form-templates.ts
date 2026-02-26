/**
 * デフォルトフォームテンプレート（D氏提案）
 */

import type { FormField } from '@/lib/types/form';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'contact' | 'survey' | 'registration' | 'feedback';
  schema: FormField[];
  defaultSettings: Record<string, unknown>;
}

export const DEFAULT_TEMPLATES: FormTemplate[] = [
  {
    id: 'contact-basic',
    name: 'お問い合わせ（基本）',
    description: '基本的なお問い合わせフォーム',
    category: 'contact',
    schema: [
      { id: 'name', type: 'text', label: 'お名前', order: 0, validation: { required: true, maxLength: 100 } },
      { id: 'email', type: 'email', label: 'メールアドレス', order: 1, validation: { required: true } },
      { id: 'message', type: 'textarea', label: 'メッセージ', order: 2, validation: { required: true, maxLength: 2000 } },
    ],
    defaultSettings: { requireEmail: true, requireName: true },
  },
  {
    id: 'event-registration',
    name: 'イベント申込',
    description: 'イベント・セミナーの参加申し込み',
    category: 'registration',
    schema: [
      { id: 'name', type: 'text', label: 'お名前', order: 0, validation: { required: true } },
      { id: 'email', type: 'email', label: 'メールアドレス', order: 1, validation: { required: true } },
      { id: 'company', type: 'text', label: '会社名', order: 2, validation: {} },
      { id: 'notes', type: 'textarea', label: '備考', order: 3, validation: { maxLength: 1000 } },
    ],
    defaultSettings: { requireEmail: true, requireName: true, allowMultipleSubmissions: false },
  },
  {
    id: 'feedback',
    name: 'フィードバック',
    description: 'サービス・製品のフィードバック収集',
    category: 'feedback',
    schema: [
      { id: 'name', type: 'text', label: 'お名前', order: 0, validation: {} },
      { id: 'email', type: 'email', label: 'メールアドレス', order: 1, validation: {} },
      { id: 'rating', type: 'radio', label: '満足度', order: 2, validation: { required: true }, options: ['とても満足', '満足', '普通', '不満', 'とても不満'] },
      { id: 'feedback', type: 'textarea', label: 'ご意見・ご感想', order: 3, validation: { maxLength: 3000 } },
    ],
    defaultSettings: { requireEmail: false, requireName: false },
  },
];
