-- =============================================================================
-- Supabase Migration: CRM_test Schema
-- Source: jkmexhfucsgeecorucgs → Target: aipdojhchzqdykbucznr
--
-- 実行順序:
-- 1. Step 0: スキーマ作成 & 権限設定 (この SQL の冒頭)
-- 2. Step 1: CRM Platform テーブル (001_initial_schema)
-- 3. Step 2: トリガー & インデックス (002_triggers_and_indexes)
-- 4. Step 3: フィーチャーフラグ (003_feature_flags)
-- 5. Step 4: RLS ポリシー (004_rls_policies)
-- 6. Step 5: FDC Modular テーブル (001_create_tables)
-- =============================================================================

-- =============================================================================
-- Step 0: スキーマ作成 & 権限設定
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS "CRM_test";

GRANT USAGE ON SCHEMA "CRM_test" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "CRM_test" TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "CRM_test" TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "CRM_test" GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "CRM_test" GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- PostgREST にスキーマ公開
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public, CRM_test';
NOTIFY pgrst, 'reload config';

-- search_path を設定
SET search_path TO "CRM_test";

-- =============================================================================
-- Step 1: CRM Platform テーブル (001_initial_schema.sql)
-- =============================================================================

-- ワークスペース（テナント）
CREATE TABLE "CRM_test".workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ユーザープロファイル
CREATE TABLE "CRM_test".profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ワークスペースメンバー（権限管理）
CREATE TABLE "CRM_test".workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES "CRM_test".profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES "CRM_test".profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 顧客（CRM）
CREATE TABLE "CRM_test".customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead')),
  source TEXT CHECK (source IN ('referral', 'website', 'event', 'cold', 'other')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  estimated_value NUMERIC(12, 4) CHECK (estimated_value >= 0),
  created_by UUID REFERENCES "CRM_test".profiles(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 顧客タグ定義
CREATE TABLE "CRM_test".customer_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  color TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT,
  created_by UUID REFERENCES "CRM_test".profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, name)
);

-- 顧客タグ割り当て
CREATE TABLE "CRM_test".customer_tag_assignments (
  customer_id UUID REFERENCES "CRM_test".customers(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES "CRM_test".customer_tags(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES "CRM_test".profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(customer_id, tag_id)
);

-- 顧客行動ログ
CREATE TABLE "CRM_test".client_activity_log (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES "CRM_test".customers(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES "CRM_test".profiles(id) NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON COLUMN "CRM_test".client_activity_log.details IS 'PIIを含めない。ID参照のみ記録';

-- フォームテンプレート
CREATE TABLE "CRM_test".forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  schema JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  template_id TEXT,
  created_by UUID REFERENCES "CRM_test".profiles(id),
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- フォーム送信データ
CREATE TABLE "CRM_test".form_submissions (
  id BIGSERIAL PRIMARY KEY,
  form_id UUID REFERENCES "CRM_test".forms(id) ON DELETE CASCADE NOT NULL,
  respondent_email TEXT,
  respondent_name TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- 決済記録
CREATE TABLE "CRM_test".payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES "CRM_test".customers(id) ON DELETE SET NULL,
  amount NUMERIC(12, 4) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'JPY' CHECK (currency ~ '^[A-Z]{3}$'),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'bank_transfer', 'cash', 'other')),
  stripe_payment_intent_id TEXT,
  invoice_number TEXT,
  description TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  expected_payer_name TEXT,
  bank_transfer_ref TEXT,
  gmail_message_id TEXT,
  gmail_confirmed_at TIMESTAMPTZ,
  gmail_confirmation_subject TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES "CRM_test".profiles(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, invoice_number)
);

-- 権限セット（RBAC拡張）
CREATE TABLE "CRM_test".permission_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_role TEXT NOT NULL DEFAULT 'member' CHECK (base_role IN ('member', 'admin', 'owner')),
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES "CRM_test".profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, name)
);

-- メンバー別権限オーバーライド
CREATE TABLE "CRM_test".member_permission_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES "CRM_test".profiles(id) ON DELETE CASCADE NOT NULL,
  permission_set_id UUID REFERENCES "CRM_test".permission_sets(id) ON DELETE SET NULL,
  custom_permissions JSONB DEFAULT '{}',
  granted_by UUID REFERENCES "CRM_test".profiles(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Gmail 監視設定
CREATE TABLE "CRM_test".gmail_watch_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE NOT NULL UNIQUE,
  gmail_address TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  token_iv TEXT NOT NULL,
  token_auth_tag TEXT NOT NULL,
  token_version INTEGER NOT NULL DEFAULT 1,
  label_filter TEXT DEFAULT 'INBOX',
  bank_patterns JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_poll_at TIMESTAMPTZ,
  last_history_id TEXT,
  poll_error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_success_at TIMESTAMPTZ,
  configured_by UUID REFERENCES "CRM_test".profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Gmail 処理済みメッセージ
CREATE TABLE "CRM_test".gmail_processed_messages (
  id BIGSERIAL PRIMARY KEY,
  config_id UUID REFERENCES "CRM_test".gmail_watch_configs(id) ON DELETE CASCADE NOT NULL,
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT NOT NULL,
  from_address TEXT NOT NULL,
  subject TEXT,
  snippet TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  parse_result JSONB,
  match_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (match_status IN ('pending', 'matched', 'manual_review', 'no_match', 'ignored')),
  UNIQUE(config_id, gmail_message_id)
);

-- 入金マッチング結果
CREATE TABLE "CRM_test".payment_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE NOT NULL,
  message_id BIGINT REFERENCES "CRM_test".gmail_processed_messages(id) NOT NULL,
  payment_id UUID REFERENCES "CRM_test".payments(id) NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low', 'none')),
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  match_reasons JSONB NOT NULL DEFAULT '[]',
  parsed_amount NUMERIC(12,4),
  parsed_payer_name TEXT,
  parsed_transfer_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'auto_confirmed')),
  confirmed_by UUID REFERENCES "CRM_test".profiles(id),
  confirmed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, payment_id)
);

-- Stripe Webhook 冪等性管理
CREATE TABLE "CRM_test".stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  payload_hash TEXT NOT NULL
);
CREATE INDEX idx_stripe_events_type ON "CRM_test".stripe_webhook_events(event_type);

-- 監査ログ (CRM Platform)
CREATE TABLE "CRM_test".audit_log (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES "CRM_test".profiles(id) NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE "CRM_test".audit_log IS '365日ホット保持、法的要件で最低3年保持';

-- =============================================================================
-- Step 2: トリガー & インデックス (002_triggers_and_indexes.sql)
-- =============================================================================

-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION "CRM_test".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CRM Platform テーブルに updated_at トリガーを適用
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'workspaces', 'profiles', 'customers', 'customer_tags',
    'forms', 'payments', 'permission_sets', 'member_permission_overrides',
    'gmail_watch_configs', 'payment_matches'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON "CRM_test".%I
       FOR EACH ROW EXECUTE FUNCTION "CRM_test".update_updated_at_column()', tbl
    );
  END LOOP;
END;
$$;

-- 顧客インデックス
CREATE INDEX idx_crm_customers_workspace ON "CRM_test".customers(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_customers_status ON "CRM_test".customers(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_customers_email ON "CRM_test".customers(email);
CREATE INDEX idx_crm_customers_followup ON "CRM_test".customers(next_followup_at) WHERE next_followup_at IS NOT NULL;
CREATE INDEX idx_crm_customers_metadata ON "CRM_test".customers USING GIN (metadata jsonb_path_ops);

-- 顧客タグ
CREATE INDEX idx_crm_customer_tags_workspace ON "CRM_test".customer_tags(workspace_id);
CREATE INDEX idx_crm_tag_assignments_tag ON "CRM_test".customer_tag_assignments(tag_id);

-- 行動ログ
CREATE INDEX idx_crm_activity_log_workspace ON "CRM_test".client_activity_log(workspace_id, created_at DESC);
CREATE INDEX idx_crm_activity_log_customer ON "CRM_test".client_activity_log(customer_id);

-- フォーム
CREATE INDEX idx_crm_forms_workspace ON "CRM_test".forms(workspace_id);
CREATE INDEX idx_crm_forms_slug ON "CRM_test".forms(slug);
CREATE INDEX idx_crm_submissions_form ON "CRM_test".form_submissions(form_id);
CREATE INDEX idx_crm_submissions_submitted ON "CRM_test".form_submissions(submitted_at DESC);
CREATE INDEX idx_crm_submissions_email ON "CRM_test".form_submissions(respondent_email) WHERE respondent_email IS NOT NULL;
CREATE INDEX idx_crm_submissions_answers ON "CRM_test".form_submissions USING GIN (answers);

-- 決済
CREATE INDEX idx_crm_payments_workspace ON "CRM_test".payments(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_payments_customer ON "CRM_test".payments(customer_id);
CREATE INDEX idx_crm_payments_status ON "CRM_test".payments(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_payments_due_date ON "CRM_test".payments(workspace_id, due_date) WHERE status IN ('pending');
CREATE INDEX idx_crm_payments_gmail ON "CRM_test".payments(gmail_message_id) WHERE gmail_message_id IS NOT NULL;

-- 権限
CREATE INDEX idx_crm_permission_sets_workspace ON "CRM_test".permission_sets(workspace_id);
CREATE INDEX idx_crm_member_overrides_workspace ON "CRM_test".member_permission_overrides(workspace_id);
CREATE INDEX idx_crm_member_overrides_user ON "CRM_test".member_permission_overrides(user_id);

-- ワークスペースメンバー
CREATE INDEX idx_crm_workspace_members_user ON "CRM_test".workspace_members(user_id);
CREATE INDEX idx_crm_workspace_members_workspace_role ON "CRM_test".workspace_members(workspace_id, role);

-- Gmail
CREATE INDEX idx_crm_processed_messages_config ON "CRM_test".gmail_processed_messages(config_id);
CREATE INDEX idx_crm_processed_messages_status ON "CRM_test".gmail_processed_messages(match_status);
CREATE INDEX idx_crm_payment_matches_workspace ON "CRM_test".payment_matches(workspace_id);
CREATE INDEX idx_crm_payment_matches_status ON "CRM_test".payment_matches(status);

-- 監査ログ
CREATE INDEX idx_crm_audit_log_workspace ON "CRM_test".audit_log(workspace_id, created_at DESC);
CREATE INDEX idx_crm_audit_log_actor ON "CRM_test".audit_log(actor_id);
CREATE INDEX idx_crm_audit_log_resource ON "CRM_test".audit_log(resource_type, resource_id);

-- =============================================================================
-- Step 3: フィーチャーフラグ (003_feature_flags.sql)
-- =============================================================================

CREATE TABLE "CRM_test".workspace_feature_flags (
  workspace_id UUID REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES "CRM_test".profiles(id),
  PRIMARY KEY(workspace_id, feature_key)
);

-- =============================================================================
-- Step 4: RLS ポリシー (004_rls_policies.sql)
-- =============================================================================

ALTER TABLE "CRM_test".workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CRM_test".profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CRM_test".workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CRM_test".customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CRM_test".forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CRM_test".payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CRM_test".audit_log ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数
CREATE OR REPLACE FUNCTION "CRM_test".get_user_role(ws_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM "CRM_test".workspace_members
  WHERE workspace_id = ws_id AND user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = "CRM_test";

-- ワークスペースメンバーのみアクセス可
CREATE POLICY "workspace_access" ON "CRM_test".customers
  FOR SELECT USING ("CRM_test".get_user_role(workspace_id) IS NOT NULL);

CREATE POLICY "workspace_write" ON "CRM_test".customers
  FOR INSERT WITH CHECK (
    "CRM_test".get_user_role(workspace_id) IN ('owner', 'admin', 'member')
  );

-- =============================================================================
-- Step 5: FDC Modular テーブル (001_create_tables.sql)
-- workspaces, workspace_members は Step 1 で作成済みのため除外
-- customers は CRM Platform 版が既にあるため、
-- FDC 版 (Stripe billing) は stripe_customers として作成
-- =============================================================================

-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. users
CREATE TABLE IF NOT EXISTS "CRM_test".users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  name        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. tasks
CREATE TABLE IF NOT EXISTS "CRM_test".tasks (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  title                   text NOT NULL,
  description             text DEFAULT '',
  status                  text NOT NULL DEFAULT 'not_started',
  suit                    text,
  scheduled_date          text,
  due_date                text,
  priority                integer NOT NULL DEFAULT 0,
  action_item_id          uuid,
  linked_action_item_ids  text[] DEFAULT '{}',
  google_task_id          text,
  google_task_list_id     text,
  last_synced_at          timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- 3. leads
CREATE TABLE IF NOT EXISTS "CRM_test".leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  company_name    text NOT NULL DEFAULT '',
  contact_person  text NOT NULL DEFAULT '',
  email           text DEFAULT '',
  phone           text DEFAULT '',
  status          text NOT NULL DEFAULT 'new',
  channel         text DEFAULT '',
  memo            text DEFAULT '',
  tags            text[] DEFAULT '{}',
  lost_reason     text DEFAULT '',
  lost_feedback   text DEFAULT '',
  reminder        text,
  reminder_note   text DEFAULT '',
  next_meeting    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 4. clients
CREATE TABLE IF NOT EXISTS "CRM_test".clients (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  lead_id           uuid REFERENCES "CRM_test".leads(id) ON DELETE SET NULL,
  company_name      text DEFAULT '',
  contact_person    text NOT NULL DEFAULT '',
  email             text DEFAULT '',
  phone             text DEFAULT '',
  status            text NOT NULL DEFAULT 'active',
  contract_deadline text,
  next_meeting      text,
  notes             text DEFAULT '',
  history           jsonb DEFAULT '[]',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 5. approaches
CREATE TABLE IF NOT EXISTS "CRM_test".approaches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  lead_id       uuid NOT NULL REFERENCES "CRM_test".leads(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES "CRM_test".users(id) ON DELETE CASCADE,
  type          text NOT NULL DEFAULT 'other',
  content       text NOT NULL DEFAULT '',
  result        text DEFAULT '',
  result_note   text DEFAULT '',
  approached_at timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 6. objectives
CREATE TABLE IF NOT EXISTS "CRM_test".objectives (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text DEFAULT '',
  period        text NOT NULL,
  is_archived   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 7. key_results
CREATE TABLE IF NOT EXISTS "CRM_test".key_results (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id  uuid NOT NULL REFERENCES "CRM_test".objectives(id) ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  title         text NOT NULL,
  target_value  numeric NOT NULL DEFAULT 100,
  current_value numeric NOT NULL DEFAULT 0,
  unit          text NOT NULL DEFAULT '%',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 8. action_maps
CREATE TABLE IF NOT EXISTS "CRM_test".action_maps (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  description           text DEFAULT '',
  target_period_start   text,
  target_period_end     text,
  is_archived           boolean NOT NULL DEFAULT false,
  key_result_id         uuid REFERENCES "CRM_test".key_results(id) ON DELETE SET NULL,
  version               integer NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- 9. action_items
CREATE TABLE IF NOT EXISTS "CRM_test".action_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_map_id   uuid NOT NULL REFERENCES "CRM_test".action_maps(id) ON DELETE CASCADE,
  workspace_id    uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text DEFAULT '',
  due_date        text,
  priority        text NOT NULL DEFAULT 'medium',
  status          text NOT NULL DEFAULT 'not_started',
  parent_item_id  uuid REFERENCES "CRM_test".action_items(id) ON DELETE SET NULL,
  sort_order      integer NOT NULL DEFAULT 0,
  version         integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 10. brands
CREATE TABLE IF NOT EXISTS "CRM_test".brands (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  tagline       text DEFAULT '',
  story         text DEFAULT '',
  logo_url      text,
  created_by    uuid NOT NULL REFERENCES "CRM_test".users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 11. brand_points
CREATE TABLE IF NOT EXISTS "CRM_test".brand_points (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid NOT NULL REFERENCES "CRM_test".brands(id) ON DELETE CASCADE,
  point_type  text NOT NULL,
  content     text DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, point_type)
);

-- 12. lean_canvas
CREATE TABLE IF NOT EXISTS "CRM_test".lean_canvas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  brand_id      uuid NOT NULL REFERENCES "CRM_test".brands(id) ON DELETE CASCADE,
  title         text DEFAULT '',
  description   text DEFAULT '',
  created_by    uuid NOT NULL REFERENCES "CRM_test".users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 13. lean_canvas_blocks
CREATE TABLE IF NOT EXISTS "CRM_test".lean_canvas_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id   uuid NOT NULL REFERENCES "CRM_test".lean_canvas(id) ON DELETE CASCADE,
  block_type  text NOT NULL,
  content     text DEFAULT '',
  items       text[] DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canvas_id, block_type)
);

-- 14. mvv (Mission / Vision / Values)
CREATE TABLE IF NOT EXISTS "CRM_test".mvv (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid NOT NULL REFERENCES "CRM_test".brands(id) ON DELETE CASCADE,
  mission     text DEFAULT '',
  vision      text DEFAULT '',
  "values"    text[] DEFAULT '{}',
  created_by  uuid NOT NULL REFERENCES "CRM_test".users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 15. invitations
CREATE TABLE IF NOT EXISTS "CRM_test".invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  email         text NOT NULL,
  role          text NOT NULL DEFAULT 'MEMBER',
  token         text NOT NULL UNIQUE,
  expires_at    timestamptz NOT NULL,
  accepted_at   timestamptz,
  created_by    uuid NOT NULL REFERENCES "CRM_test".users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 16. audit_logs (FDC version - separate from CRM audit_log)
CREATE TABLE IF NOT EXISTS "CRM_test".audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES "CRM_test".workspaces(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES "CRM_test".users(id) ON DELETE CASCADE,
  action        text NOT NULL,
  details       jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 17. stripe_customers (renamed from FDC 'customers' to avoid conflict)
CREATE TABLE IF NOT EXISTS "CRM_test".stripe_customers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES "CRM_test".users(id) ON DELETE CASCADE,
  stripe_customer_id  text NOT NULL UNIQUE,
  email               text NOT NULL,
  name                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Foreign key for tasks.action_item_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tasks_action_item_id_fkey'
      AND table_schema = 'CRM_test'
      AND table_name = 'tasks'
  ) THEN
    ALTER TABLE "CRM_test".tasks
      ADD CONSTRAINT tasks_action_item_id_fkey
      FOREIGN KEY (action_item_id)
      REFERENCES "CRM_test".action_items(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- =============================================================================
-- FDC Modular インデックス
-- =============================================================================

-- tasks
CREATE INDEX IF NOT EXISTS idx_fdc_tasks_workspace_id ON "CRM_test".tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fdc_tasks_action_item_id ON "CRM_test".tasks(action_item_id);
CREATE INDEX IF NOT EXISTS idx_fdc_tasks_google_task_id ON "CRM_test".tasks(google_task_id);

-- leads
CREATE INDEX IF NOT EXISTS idx_fdc_leads_workspace_id ON "CRM_test".leads(workspace_id);

-- clients
CREATE INDEX IF NOT EXISTS idx_fdc_clients_workspace_id ON "CRM_test".clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fdc_clients_lead_id ON "CRM_test".clients(lead_id);

-- approaches
CREATE INDEX IF NOT EXISTS idx_fdc_approaches_workspace_id ON "CRM_test".approaches(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fdc_approaches_lead_id ON "CRM_test".approaches(lead_id);
CREATE INDEX IF NOT EXISTS idx_fdc_approaches_user_id ON "CRM_test".approaches(user_id);

-- objectives
CREATE INDEX IF NOT EXISTS idx_fdc_objectives_workspace_id ON "CRM_test".objectives(workspace_id);

-- key_results
CREATE INDEX IF NOT EXISTS idx_fdc_key_results_objective_id ON "CRM_test".key_results(objective_id);
CREATE INDEX IF NOT EXISTS idx_fdc_key_results_workspace_id ON "CRM_test".key_results(workspace_id);

-- action_maps
CREATE INDEX IF NOT EXISTS idx_fdc_action_maps_workspace_id ON "CRM_test".action_maps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fdc_action_maps_key_result_id ON "CRM_test".action_maps(key_result_id);

-- action_items
CREATE INDEX IF NOT EXISTS idx_fdc_action_items_action_map_id ON "CRM_test".action_items(action_map_id);
CREATE INDEX IF NOT EXISTS idx_fdc_action_items_workspace_id ON "CRM_test".action_items(workspace_id);

-- brands
CREATE INDEX IF NOT EXISTS idx_fdc_brands_workspace_id ON "CRM_test".brands(workspace_id);

-- brand_points
CREATE INDEX IF NOT EXISTS idx_fdc_brand_points_brand_id ON "CRM_test".brand_points(brand_id);

-- lean_canvas
CREATE INDEX IF NOT EXISTS idx_fdc_lean_canvas_workspace_id ON "CRM_test".lean_canvas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fdc_lean_canvas_brand_id ON "CRM_test".lean_canvas(brand_id);

-- lean_canvas_blocks
CREATE INDEX IF NOT EXISTS idx_fdc_lean_canvas_blocks_canvas_id ON "CRM_test".lean_canvas_blocks(canvas_id);

-- mvv
CREATE INDEX IF NOT EXISTS idx_fdc_mvv_brand_id ON "CRM_test".mvv(brand_id);

-- invitations
CREATE INDEX IF NOT EXISTS idx_fdc_invitations_workspace_id ON "CRM_test".invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fdc_invitations_token ON "CRM_test".invitations(token);
CREATE INDEX IF NOT EXISTS idx_fdc_invitations_email ON "CRM_test".invitations(email);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_fdc_audit_logs_workspace_id ON "CRM_test".audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fdc_audit_logs_user_id ON "CRM_test".audit_logs(user_id);

-- stripe_customers
CREATE INDEX IF NOT EXISTS idx_fdc_stripe_customers_user_id ON "CRM_test".stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_fdc_stripe_customers_stripe_id ON "CRM_test".stripe_customers(stripe_customer_id);

-- =============================================================================
-- FDC updated_at トリガー
-- =============================================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'users', 'tasks', 'leads', 'clients', 'approaches',
      'objectives', 'key_results', 'action_maps', 'action_items',
      'brands', 'brand_points', 'lean_canvas', 'lean_canvas_blocks',
      'mvv', 'stripe_customers'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON "CRM_test".%I; '
      'CREATE TRIGGER trg_%s_updated_at '
      'BEFORE UPDATE ON "CRM_test".%I '
      'FOR EACH ROW EXECUTE FUNCTION "CRM_test".update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END
$$;

-- =============================================================================
-- 完了: CRM_test スキーマにすべてのテーブルが作成されました
-- =============================================================================
