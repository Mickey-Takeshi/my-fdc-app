/**
 * app/api/billing/workshop/checkout/route.ts
 *
 * Stripe Checkout Session 作成 API（Phase 47）
 * POST /api/billing/workshop/checkout
 * - 認証済みユーザーの Stripe Customer を取得または作成
 * - Checkout Session を生成して URL を返却
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getStripeClient, isStripeConfigured } from '@/lib/server/stripe';
import type { BillingCycle } from '@/lib/types/billing';

const CheckoutSchema = z.object({
  workspace_id: z.uuid(),
  billing_cycle: z.enum(['monthly', 'half_yearly'] as const),
  success_url: z.url(),
  cancel_url: z.url(),
});

/**
 * billing_cycle に応じた Stripe Price ID を取得
 */
function getPriceId(cycle: BillingCycle): string {
  const priceId =
    cycle === 'monthly'
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_HALF_YEARLY;

  if (!priceId) {
    throw new Error(`STRIPE_PRICE_ID for ${cycle} is not configured`);
  }
  return priceId;
}

/**
 * POST /api/billing/workshop/checkout
 * Checkout Session を作成し、URL を返却
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Billing is not configured' },
      { status: 503 }
    );
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: z.prettifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { workspace_id, billing_cycle, success_url, cancel_url } = parsed.data;

  try {
    const stripe = getStripeClient();
    const supabase = createServiceClient();

    // 既存の Stripe Customer を検索
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let stripeCustomerId: string;

    if (existingCustomer?.stripe_customer_id) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      // Stripe Customer を新規作成
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          user_id: user.id,
          workspace_id,
        },
      });

      stripeCustomerId = customer.id;

      // DB に保存
      await supabase.from('customers').upsert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
        email: user.email,
        name: user.name,
      });
    }

    const priceId = getPriceId(billing_cycle);

    // Checkout Session 作成
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      subscription_data: {
        metadata: {
          workspace_id,
          billing_cycle,
        },
      },
      metadata: {
        workspace_id,
        user_id: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
