import { NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/server/auth-guard';
import { getStripeClient } from '@/lib/stripe/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  const workspaceId = request.headers.get('x-workspace-id');
  if (!workspaceId) return apiError('BAD_REQUEST', 'Workspace ID required', 400);

  const auth = await requireAuth(request, workspaceId, 'workspace:billing');
  if (isAuthError(auth)) return auth;

  const supabase = getAdminClient();
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('stripe_customer_id')
    .eq('id', workspaceId)
    .single();

  if (!workspace?.stripe_customer_id) {
    return apiError('NOT_FOUND', 'No Stripe customer found', 404);
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  });

  return apiSuccess({ url: session.url });
}
