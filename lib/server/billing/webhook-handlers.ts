/**
 * lib/server/billing/webhook-handlers.ts
 *
 * Stripe Webhook イベントハンドラー（Phase 49）
 * 各イベント種別に応じたDB更新処理
 *
 * Note: Stripe API v2026-02-25 (clover) に準拠
 * - Subscription.current_period_start/end は SubscriptionItem に移動
 * - Invoice.subscription は Invoice.parent.subscription_details に移動
 */

import type Stripe from 'stripe';
import { createServiceClient } from '@/lib/server/supabase';
import type { SubscriptionStatus, BillingCycle } from '@/lib/types/billing';

// -- Type Helpers -----------------------------------------------------------

/**
 * Stripe subscription status を内部ステータスにマッピング
 */
function mapSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    trialing: 'trialing',
    unpaid: 'past_due',
    incomplete: 'view_only',
    incomplete_expired: 'canceled',
    paused: 'view_only',
  };

  return statusMap[stripeStatus] ?? 'view_only';
}

/**
 * メタデータから billing_cycle を取得
 */
function extractBillingCycle(metadata: Stripe.Metadata | null): BillingCycle {
  const cycle = metadata?.billing_cycle;
  if (cycle === 'half_yearly') return 'half_yearly';
  return 'monthly';
}

/**
 * Unix timestamp を ISO 文字列に変換
 */
function unixToISO(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Invoice から関連する subscription ID を抽出
 * Stripe API v2026-02-25 (clover) では parent.subscription_details を使用
 */
function extractSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent;
  if (!parent || parent.type !== 'subscription_details') {
    return null;
  }

  const subDetails = parent.subscription_details;
  if (!subDetails) return null;

  const sub = subDetails.subscription;
  if (typeof sub === 'string') return sub;
  if (sub && typeof sub === 'object' && 'id' in sub) return sub.id;
  return null;
}

/**
 * Subscription の items から current_period_start/end を取得
 * Stripe API v2026-02-25 (clover) では period は SubscriptionItem に存在
 */
function extractPeriodFromSubscription(subscription: Stripe.Subscription): {
  periodStart: string;
  periodEnd: string;
} {
  const items = subscription.items?.data;
  if (items && items.length > 0) {
    const firstItem = items[0];
    return {
      periodStart: unixToISO(firstItem.current_period_start),
      periodEnd: unixToISO(firstItem.current_period_end),
    };
  }

  // フォールバック: created を使用
  return {
    periodStart: unixToISO(subscription.created),
    periodEnd: new Date().toISOString(),
  };
}

// -- Handlers ---------------------------------------------------------------

/**
 * checkout.session.completed ハンドラー
 * Checkout 完了時にサブスクリプションレコードを作成
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const supabase = createServiceClient();
  const workspaceId = session.metadata?.workspace_id;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;

  if (!workspaceId || !subscriptionId) {
    console.error('Checkout session missing workspace_id or subscription_id:', session.id);
    return;
  }

  const billingCycle = extractBillingCycle(session.metadata);

  const { error } = await supabase.from('workshop_subscriptions').upsert(
    {
      workspace_id: workspaceId,
      stripe_subscription_id: subscriptionId,
      billing_cycle: billingCycle,
      status: 'active' satisfies SubscriptionStatus,
      contract_start_date: new Date().toISOString().split('T')[0],
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' }
  );

  if (error) {
    console.error('Failed to upsert subscription on checkout:', error);
    throw error;
  }

  console.info(
    `Checkout completed: workspace=${workspaceId}, subscription=${subscriptionId}`
  );
}

/**
 * customer.subscription.updated ハンドラー
 * サブスクリプションの状態変更を同期
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const supabase = createServiceClient();

  const status = mapSubscriptionStatus(subscription.status);
  const billingCycle = extractBillingCycle(subscription.metadata);
  const { periodStart, periodEnd } = extractPeriodFromSubscription(subscription);

  const updateData: Record<string, unknown> = {
    status,
    billing_cycle: billingCycle,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  };

  if (subscription.canceled_at) {
    updateData.canceled_at = unixToISO(subscription.canceled_at);
  }

  if (subscription.cancel_at) {
    updateData.contract_end_date = unixToISO(subscription.cancel_at);
  }

  const { error } = await supabase
    .from('workshop_subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }

  console.info(
    `Subscription updated: ${subscription.id}, status=${status}`
  );
}

/**
 * customer.subscription.deleted ハンドラー
 * サブスクリプション解約時の処理
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('workshop_subscriptions')
    .update({
      status: 'canceled' satisfies SubscriptionStatus,
      canceled_at: new Date().toISOString(),
      contract_end_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to mark subscription as canceled:', error);
    throw error;
  }

  console.info(`Subscription canceled: ${subscription.id}`);
}

/**
 * invoice.paid ハンドラー
 * 請求書の支払い完了を記録
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const supabase = createServiceClient();

  const subscriptionId = extractSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    console.warn('Invoice has no subscription, skipping:', invoice.id);
    return;
  }

  const { data: sub } = await supabase
    .from('workshop_subscriptions')
    .select('id, workspace_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!sub) {
    console.warn('No matching subscription found for invoice:', invoice.id);
    return;
  }

  const periodStart = unixToISO(invoice.period_start);
  const periodEnd = unixToISO(invoice.period_end);

  const { error } = await supabase.from('invoices').upsert(
    {
      workspace_id: sub.workspace_id,
      stripe_invoice_id: invoice.id,
      subscription_id: sub.id,
      amount: invoice.amount_paid ?? 0,
      currency: invoice.currency ?? 'jpy',
      status: 'paid',
      pdf_url: invoice.invoice_pdf ?? null,
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      period_start: periodStart,
      period_end: periodEnd,
      paid_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_invoice_id' }
  );

  if (error) {
    console.error('Failed to record paid invoice:', error);
    throw error;
  }

  console.info(`Invoice paid: ${invoice.id}, amount=${invoice.amount_paid}`);
}

/**
 * invoice.payment_failed ハンドラー
 * 支払い失敗の記録
 */
export async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const supabase = createServiceClient();

  const subscriptionId = extractSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    console.warn('Failed invoice has no subscription, skipping:', invoice.id);
    return;
  }

  // サブスクリプションのステータスを past_due に更新
  const { error: subError } = await supabase
    .from('workshop_subscriptions')
    .update({
      status: 'past_due' satisfies SubscriptionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (subError) {
    console.error('Failed to update subscription status on payment failure:', subError);
  }

  // 失敗した請求書を記録
  const { data: sub } = await supabase
    .from('workshop_subscriptions')
    .select('id, workspace_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (sub) {
    const periodStart = unixToISO(invoice.period_start);
    const periodEnd = unixToISO(invoice.period_end);

    await supabase.from('invoices').upsert(
      {
        workspace_id: sub.workspace_id,
        stripe_invoice_id: invoice.id,
        subscription_id: sub.id,
        amount: invoice.amount_due ?? 0,
        currency: invoice.currency ?? 'jpy',
        status: 'open',
        pdf_url: invoice.invoice_pdf ?? null,
        hosted_invoice_url: invoice.hosted_invoice_url ?? null,
        period_start: periodStart,
        period_end: periodEnd,
      },
      { onConflict: 'stripe_invoice_id' }
    );
  }

  console.warn(`Payment failed: invoice=${invoice.id}, subscription=${subscriptionId}`);
}
