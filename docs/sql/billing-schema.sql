-- =============================================================================
-- billing-schema.sql
--
-- Phase 47: 課金テーブルスキーマ（参照用 - 直接実行しない）
-- Supabase Dashboard の SQL Editor で必要な部分を手動適用すること
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. organizations テーブル拡張（Stripe 顧客・カスタム価格設定）
-- ---------------------------------------------------------------------------
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS custom_monthly_price INTEGER,        -- 円単位
  ADD COLUMN IF NOT EXISTS custom_half_yearly_price INTEGER,    -- 円単位
  ADD COLUMN IF NOT EXISTS volume_discount_percent INTEGER DEFAULT 0
    CHECK (volume_discount_percent >= 0 AND volume_discount_percent <= 100);

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer
  ON organizations (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. customers テーブル（ユーザーと Stripe Customer の紐付け）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT customers_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id
  ON customers (user_id);

CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id
  ON customers (stripe_customer_id);

-- ---------------------------------------------------------------------------
-- 3. workshop_subscriptions テーブル
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshop_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'half_yearly')),
  status TEXT NOT NULL DEFAULT 'view_only'
    CHECK (status IN ('view_only', 'active', 'past_due', 'canceled', 'trialing')),
  plan_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_tier IN ('free', 'starter', 'team', 'yourSaas')),
  monthly_price INTEGER NOT NULL DEFAULT 0,
  contract_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contract_end_date DATE,
  canceled_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '1 month',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ws_subs_workspace_id
  ON workshop_subscriptions (workspace_id);

CREATE INDEX IF NOT EXISTS idx_ws_subs_stripe_subscription_id
  ON workshop_subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ws_subs_status
  ON workshop_subscriptions (status);

-- ---------------------------------------------------------------------------
-- 4. invoices テーブル
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  subscription_id UUID REFERENCES workshop_subscriptions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,                -- 円単位
  currency TEXT NOT NULL DEFAULT 'jpy',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  pdf_url TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_workspace_id
  ON invoices (workspace_id);

CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id
  ON invoices (stripe_invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON invoices (status);

-- ---------------------------------------------------------------------------
-- 5. RLS ポリシー（必要に応じて有効化）
-- ---------------------------------------------------------------------------

-- customers: ユーザー本人のみ閲覧可
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY customers_select ON customers FOR SELECT
--   USING (user_id = auth.uid());

-- workshop_subscriptions: ワークスペースメンバーのみ閲覧可
-- ALTER TABLE workshop_subscriptions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY ws_subs_select ON workshop_subscriptions FOR SELECT
--   USING (workspace_id IN (
--     SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
--   ));

-- invoices: ワークスペースメンバーのみ閲覧可
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY invoices_select ON invoices FOR SELECT
--   USING (workspace_id IN (
--     SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
--   ));
