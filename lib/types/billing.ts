/**
 * lib/types/billing.ts
 *
 * 課金・サブスクリプション関連の型定義（Phase 47）
 */

// -- Billing Cycle ----------------------------------------------------------

export type BillingCycle = 'monthly' | 'half_yearly';

// -- Subscription Status ----------------------------------------------------

export type SubscriptionStatus =
  | 'view_only'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing';

// -- Plan Tier --------------------------------------------------------------

export type PlanTier = 'free' | 'starter' | 'team' | 'yourSaas';

// -- Workshop Subscription --------------------------------------------------

export interface WorkshopSubscription {
  id: string;
  workspace_id: string;
  stripe_subscription_id: string | null;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  plan_tier: PlanTier;
  monthly_price: number;
  contract_start_date: string;
  contract_end_date: string | null;
  canceled_at: string | null;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

// -- Customer Record --------------------------------------------------------

export interface CustomerRecord {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

// -- Invoice Record ---------------------------------------------------------

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface InvoiceRecord {
  id: string;
  workspace_id: string;
  stripe_invoice_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  pdf_url: string | null;
  hosted_invoice_url: string | null;
  period_start: string;
  period_end: string;
  paid_at: string | null;
  created_at: string;
}

// -- Organization Billing ---------------------------------------------------

export interface OrganizationBilling {
  id: string;
  stripe_customer_id: string | null;
  custom_monthly_price: number | null;
  custom_half_yearly_price: number | null;
  volume_discount_percent: number;
  created_at: string;
  updated_at: string;
}

// -- Checkout Session Request -----------------------------------------------

export interface CheckoutSessionRequest {
  workspace_id: string;
  billing_cycle: BillingCycle;
  success_url: string;
  cancel_url: string;
}

// -- Portal Session Request -------------------------------------------------

export interface PortalSessionRequest {
  return_url: string;
}
