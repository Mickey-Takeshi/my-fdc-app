import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { apiLogger } from '@/lib/server/logger';
import { createHash } from 'crypto';

const log = apiLogger({ service: 'stripe-webhook' });

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) return apiError('BAD_REQUEST', 'Missing stripe-signature', 400);

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return apiError('BAD_REQUEST', 'Invalid signature', 400);
  }

  const admin = createAdminClient();

  // 冪等性チェック
  const payloadHash = createHash('sha256').update(body).digest('hex');
  const { data: existing } = await admin
    .from('stripe_webhook_events')
    .select('event_id')
    .eq('event_id', event.id)
    .single();

  if (existing) {
    log.info({ eventId: event.id }, 'Duplicate webhook event, skipping');
    return apiSuccess({ received: true, duplicate: true });
  }

  await admin.from('stripe_webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    payload_hash: payloadHash,
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const workspaceId = session.metadata?.workspaceId;
        if (workspaceId && session.subscription) {
          await admin.from('workspaces').update({
            plan: 'pro',
            stripe_subscription_id: session.subscription as string,
          }).eq('id', workspaceId);
          log.info({ workspaceId }, 'Plan upgraded to pro');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const { data: workspace } = await admin
          .from('workspaces')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (workspace) {
          const status = subscription.status;
          if (status === 'active') {
            log.info({ workspaceId: workspace.id }, 'Subscription updated');
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await admin.from('workspaces').update({
          plan: 'free',
          stripe_subscription_id: null,
        }).eq('stripe_subscription_id', subscription.id);
        log.info({ subscriptionId: subscription.id }, 'Subscription cancelled, downgraded to free');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        log.warn({ customerId: invoice.customer }, 'Invoice payment failed');
        break;
      }

      default:
        log.debug({ eventType: event.type }, 'Unhandled webhook event');
    }
  } catch (err) {
    log.error({ err, eventId: event.id }, 'Webhook processing failed');
    return apiError('INTERNAL', 'Webhook processing failed', 500);
  }

  return apiSuccess({ received: true });
}
