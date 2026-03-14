import type { BankPattern } from '@/lib/types/gmail-billing';

export const DEFAULT_BANK_PATTERNS: BankPattern[] = [
  {
    bank_name: '三菱UFJ銀行',
    from_pattern: 'direct@bk\\.mufg\\.jp',
    subject_pattern: '入金のお知らせ|振込入金',
    amount_regex: '(?<amount>[\\d,]+)円.*入金',
    payer_regex: '',
    date_regex: '',
  },
  {
    bank_name: '三井住友銀行',
    from_pattern: 'info@smbc\\.co\\.jp',
    subject_pattern: '入金のご連絡',
    amount_regex: '(?<amount>[\\d,]+)円',
    payer_regex: '',
    date_regex: '',
  },
  {
    bank_name: 'みずほ銀行',
    from_pattern: 'mizuhobank@e\\.mizuhobank\\.co\\.jp',
    subject_pattern: '入金',
    amount_regex: '(?<amount>[\\d,]+)円',
    payer_regex: '',
    date_regex: '',
  },
  {
    bank_name: '楽天銀行',
    from_pattern: 'service@ac\\.rakuten-bank\\.co\\.jp',
    subject_pattern: '入金がありました',
    amount_regex: '(?<amount>[\\d,]+)円',
    payer_regex: '',
    date_regex: '',
  },
];
