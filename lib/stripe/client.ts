import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  stripeClient = new Stripe(key, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  });

  return stripeClient;
}

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    limits: { members: 3, customers: 100, forms: 3 },
  },
  pro: {
    name: 'Pro',
    priceId: 'price_xxx',
    price: 2980,
    limits: { members: 20, customers: 10000, forms: 50 },
  },
  enterprise: {
    name: 'Enterprise',
    priceId: 'price_yyy',
    price: 9800,
    limits: { members: -1, customers: -1, forms: -1 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
