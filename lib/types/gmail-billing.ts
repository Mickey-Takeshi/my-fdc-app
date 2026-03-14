export interface GmailWatchConfig {
  id: string;
  workspace_id: string;
  gmail_address: string;
  label_filter: string;
  bank_patterns: BankPattern[];
  is_active: boolean;
  last_poll_at: string | null;
  poll_error_count: number;
  last_error: string | null;
  last_success_at: string | null;
}

export interface BankPattern {
  bank_name: string;
  from_pattern: string;
  subject_pattern: string;
  amount_regex: string;
  payer_regex: string;
  date_regex: string;
}

export interface ParsedPaymentInfo {
  amount: number | null;
  payerName: string | null;
  transferDate: string | null;
  bankName: string | null;
  rawSubject: string;
}

export type MatchConfidence = 'high' | 'medium' | 'low' | 'none';
export type MatchStatus = 'pending' | 'confirmed' | 'rejected' | 'auto_confirmed';
