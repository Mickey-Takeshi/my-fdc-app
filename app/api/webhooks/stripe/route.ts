import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/server/logger';

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const log = logger.child({ service: 'stripe-webhook', eventId: event.id });

  // 冪等性保証（A氏）: チェック済みイベント
  const supabase = getAdminClient();
  const { data: existing } = await supabase
    .from('audit_log')
    .select('id')
    .eq('action', `stripe:${event.type}`)
    .eq('resource_id', event.id)
    .single();

  if (existing) {
    log.info('Duplicate event, skipping');
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const workspaceId = session.metadata?.workspaceId;
        if (workspaceId && session.subscription) {
          await supabase
            .from('workspaces')
            .update({
              plan: 'pro',
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', workspaceId);
          log.info({ workspaceId }, 'Plan upgraded to pro');
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (workspace) {
          const status = subscription.status;
          if (status === 'active') {
            log.info({ workspaceId: workspace.id }, 'Subscription active');
          } else if (status === 'past_due') {
            log.warn({ workspaceId: workspace.id }, 'Subscription past due');
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await supabase
          .from('workspaces')
          .update({ plan: 'free', stripe_subscription_id: null })
          .eq('stripe_subscription_id', subscription.id);
        log.info('Subscription cancelled, downgraded to free');
        break;
      }
      default:
        log.info({ type: event.type }, 'Unhandled event type');
    }

    // Record event for idempotency
    await supabase.from('audit_log').insert({
      actor_id: '00000000-0000-0000-0000-000000000000',
      actor_email: 'stripe-webhook',
      action: `stripe:${event.type}`,
      resource_type: 'stripe_event',
      resource_id: event.id,
      changes: { event_type: event.type },
    });
  } catch (err) {
    log.error({ err }, 'Webhook processing failed');
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
