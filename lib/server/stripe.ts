/**
 * lib/server/stripe.ts
 *
 * Stripe SDK クライアント（Phase 47）
 * Lazy initialization パターンにより STRIPE_SECRET_KEY 未設定でもビルドが通る
 */

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Stripe が設定済みかどうかを確認
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Stripe クライアントを取得（遅延初期化）
 * STRIPE_SECRET_KEY が未設定の場合はエラーをスロー
 */
export function getStripeClient(): Stripe {
  if (_stripe) return _stripe;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Set it in .env.local to enable billing features.'
    );
  }

  _stripe = new Stripe(secretKey, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  });

  return _stripe;
}

/**
 * Stripe Webhook シークレットを取得
 */
export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is not configured. Set it in .env.local to enable webhook handling.'
    );
  }
  return secret;
}
