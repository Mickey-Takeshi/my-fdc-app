import { z } from 'zod';

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentMethod = 'stripe' | 'bank_transfer' | 'cash' | 'other';

export type MatchConfidence = 'high' | 'medium' | 'low' | 'none';
export type MatchStatus = 'pending' | 'confirmed' | 'rejected' | 'auto_confirmed';
export type MessageMatchStatus =
  | 'pending'
  | 'matched'
  | 'manual_review'
  | 'no_match'
  | 'ignored';

export interface Payment {
  id: string;
  workspace_id: string;
  customer_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  stripe_payment_intent_id: string | null;
  invoice_number: string | null;
  description: string | null;
  due_date: string | null;
  paid_at: string | null;
  expected_payer_name: string | null;
  bank_transfer_ref: string | null;
  gmail_message_id: string | null;
  gmail_confirmed_at: string | null;
  gmail_confirmation_subject: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  customer?: { company_name: string; contact_name: string };
}

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

export interface GmailWatchConfig {
  id: string;
  workspaceId: string;
  gmailAddress: string;
  labelFilter: string;
  bankPatterns: BankPattern[];
  isActive: boolean;
  lastPollAt: string | null;
  lastHistoryId: string | null;
  pollErrorCount: number;
  lastError: string | null;
  lastSuccessAt: string | null;
  configuredBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMatch {
  id: string;
  workspaceId: string;
  messageId: number;
  paymentId: string;
  confidence: MatchConfidence;
  confidenceScore: number;
  matchReasons: string[];
  parsedAmount: number | null;
  parsedPayerName: string | null;
  parsedTransferDate: string | null;
  status: MatchStatus;
  confirmedBy: string | null;
  confirmedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
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

export const paymentSchema = z.object({
  customer_id: z.string().uuid().optional(),
  amount: z.number().nonnegative('金額は0以上の数値です'),
  currency: z.string().regex(/^[A-Z]{3}$/).default('JPY'),
  payment_method: z.enum(['stripe', 'bank_transfer', 'cash', 'other']),
  invoice_number: z.string().optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  expected_payer_name: z.string().optional(),
  bank_transfer_ref: z.string().optional(),
});
