import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth-guard';
import { stripe, PLANS } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { z } from 'zod';

const checkoutSchema = z.object({
  workspaceId: z.string().uuid(),
  plan: z.enum(['pro', 'enterprise']),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION', parsed.error.issues[0].message, 400);

  const auth = await requireAuth(request, parsed.data.workspaceId);
  if (auth instanceof Response) return auth;

  const admin = createAdminClient();
  const { data: workspace } = await admin
    .from('workspaces')
    .select('stripe_customer_id')
    .eq('id', parsed.data.workspaceId)
    .single();

  let customerId = workspace?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({ email: auth.email, metadata: { workspaceId: parsed.data.workspaceId } });
    customerId = customer.id;
    await admin.from('workspaces').update({ stripe_customer_id: customerId }).eq('id', parsed.data.workspaceId);
  }

  const planConfig = PLANS[parsed.data.plan];
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=cancel`,
    metadata: { workspaceId: parsed.data.workspaceId },
  });

  return apiSuccess({ url: session.url });
}
