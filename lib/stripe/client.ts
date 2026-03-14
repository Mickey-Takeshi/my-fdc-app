import Stripe from 'stripe';

function createStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // ビルド時は Stripe 未設定でも通す
    return null as unknown as Stripe;
  }
  return new Stripe(key, { typescript: true });
}

export const stripe = createStripeClient();

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    limits: { members: 3, customers: 100, forms: 3 },
  },
  pro: {
    name: 'Pro',
    priceId: 'price_xxx', // Stripe ダッシュボードで作成後に置き換え
    price: 2980,
    limits: { members: 20, customers: 10000, forms: 50 },
  },
  enterprise: {
    name: 'Enterprise',
    priceId: 'price_yyy', // Stripe ダッシュボードで作成後に置き換え
    price: 9800,
    limits: { members: -1, customers: -1, forms: -1 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
