/**
 * app/api/billing/workshop/portal/route.ts
 *
 * Stripe Customer Portal セッション作成 API（Phase 47）
 * POST /api/billing/workshop/portal
 * - 認証済みユーザーの Stripe Customer ID を取得
 * - Customer Portal セッションを生成して URL を返却
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getSessionUser } from '@/lib/server/auth';
import { createServiceClient } from '@/lib/server/supabase';
import { getStripeClient, isStripeConfigured } from '@/lib/server/stripe';

const PortalSchema = z.object({
  return_url: z.url(),
});

/**
 * POST /api/billing/workshop/portal
 * Customer Portal セッションを作成し、URL を返却
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

  const parsed = PortalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: z.prettifyError(parsed.error) },
      { status: 400 }
    );
  }

  const { return_url } = parsed.data;

  try {
    const supabase = createServiceClient();

    // Stripe Customer ID を取得
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 404 }
      );
    }

    const stripe = getStripeClient();

    // Customer Portal セッション作成
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
