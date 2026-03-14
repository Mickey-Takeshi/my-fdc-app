export interface FormTemplate {
  id: string;
  name: string;
  category: string;
  schema: Array<{
    id: string;
    type: string;
    label: string;
    order: number;
    validation: Record<string, unknown>;
  }>;
}

export const DEFAULT_TEMPLATES: FormTemplate[] = [
  {
    id: 'contact-basic',
    name: 'お問い合わせ（基本）',
    category: 'contact',
    schema: [
      { id: 'name', type: 'text', label: 'お名前', order: 0, validation: { required: true, maxLength: 100 } },
      { id: 'email', type: 'email', label: 'メールアドレス', order: 1, validation: { required: true } },
      { id: 'message', type: 'textarea', label: 'メッセージ', order: 2, validation: { required: true, maxLength: 2000 } },
    ],
  },
  {
    id: 'event-registration',
    name: 'イベント申込',
    category: 'registration',
    schema: [
      { id: 'name', type: 'text', label: 'お名前', order: 0, validation: { required: true } },
      { id: 'email', type: 'email', label: 'メールアドレス', order: 1, validation: { required: true } },
      { id: 'company', type: 'text', label: '会社名', order: 2, validation: {} },
      { id: 'notes', type: 'textarea', label: '備考', order: 3, validation: { maxLength: 1000 } },
    ],
  },
];
