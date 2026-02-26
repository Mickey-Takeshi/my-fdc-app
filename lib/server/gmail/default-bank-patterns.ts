import type { BankPattern } from '@/lib/types/gmail-billing';

export const DEFAULT_BANK_PATTERNS: BankPattern[] = [
  {
    id: 'mufg',
    bankName: '三菱UFJ銀行',
    fromPattern: 'direct@bk\\.mufg\\.jp',
    subjectPattern: '入金のお知らせ|振込入金',
    amountPattern: '(?<amount>[\\d,]+)円.*入金',
    isActive: true,
  },
  {
    id: 'smbc',
    bankName: '三井住友銀行',
    fromPattern: 'info@smbc\\.co\\.jp',
    subjectPattern: '入金のご連絡',
    amountPattern: '(?<amount>[\\d,]+)円',
    isActive: true,
  },
  {
    id: 'mizuho',
    bankName: 'みずほ銀行',
    fromPattern: 'mizuhobank@e\\.mizuhobank\\.co\\.jp',
    subjectPattern: '入金',
    amountPattern: '(?<amount>[\\d,]+)円',
    isActive: true,
  },
  {
    id: 'rakuten',
    bankName: '楽天銀行',
    fromPattern: 'service@ac\\.rakuten-bank\\.co\\.jp',
    subjectPattern: '入金がありました',
    amountPattern: '(?<amount>[\\d,]+)円',
    isActive: true,
  },
];
