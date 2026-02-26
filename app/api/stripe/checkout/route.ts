import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getStripeClient, PLANS } from '@/lib/stripe/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'enterprise']),
});

export async function POST(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'workspace:billing');
  if (isAuthError(auth)) return auth;

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION', 'Invalid plan', 400);
  }

  const plan = PLANS[parsed.data.plan];
  if (!('priceId' in plan)) {
    return apiError('BAD_REQUEST', 'Invalid plan', 400);
  }

  const stripe = getStripeClient();
  const supabase = getAdminClient();

  // Get or create Stripe customer
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('stripe_customer_id, name')
    .eq('id', workspaceId)
    .single();

  let customerId = workspace?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { workspaceId },
      name: workspace?.name,
    });
    customerId = customer.id;

    await supabase
      .from('workspaces')
      .update({ stripe_customer_id: customerId })
      .eq('id', workspaceId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?cancelled=true`,
    metadata: { workspaceId },
  });

  return apiSuccess({ url: session.url });
}
