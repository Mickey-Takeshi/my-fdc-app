export type MatchConfidence = 'high' | 'medium' | 'low' | 'none';
export type MatchStatus = 'pending' | 'confirmed' | 'rejected' | 'auto_confirmed';
export type MessageMatchStatus =
  | 'pending'
  | 'matched'
  | 'manual_review'
  | 'no_match'
  | 'ignored';

export interface BankPattern {
  id: string;
  bankName: string;
  fromPattern: string;
  subjectPattern: string;
  amountPattern: string;
  payerNamePattern?: string;
  transferDatePattern?: string;
  isActive: boolean;
}

export interface ParsedPaymentInfo {
  amount: number | null;
  payerName: string | null;
  transferDate: string | null;
  bankName: string | null;
  rawSnippet: string;
  parseConfidence: number;
}

export interface BillingDashboardStats {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  overduePayments: number;
  pendingMatches: number;
  totalRevenue: number;
  pendingRevenue: number;
  gmailStatus: {
    isActive: boolean;
    lastPollAt: string | null;
    lastSuccessAt: string | null;
    errorCount: number;
    lastError: string | null;
  };
}
