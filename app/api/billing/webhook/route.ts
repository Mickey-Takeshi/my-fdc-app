/**
 * app/api/billing/webhook/route.ts
 *
 * Stripe Webhook ハンドラー（Phase 47）
 * POST /api/billing/webhook
 * - Stripe の署名検証
 * - イベント種別に応じたハンドラーへの振り分け
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient, getWebhookSecret, isStripeConfigured } from '@/lib/server/stripe';
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handlePaymentFailed,
} from '@/lib/server/billing/webhook-handlers';

/**
 * Webhook で処理するイベント種別
 */
const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
]);

/**
 * POST /api/billing/webhook
 * Stripe Webhook イベントを受信・処理
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Billing is not configured' },
      { status: 503 }
    );
  }

  const stripe = getStripeClient();
  const webhookSecret = getWebhookSecret();

  // Raw body を取得（署名検証に必要）
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // 未対応イベントはスキップ
  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, handled: false });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true, handled: true });
  } catch (error) {
    console.error(`Webhook handler error for ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
