-- ===========================================
-- SaaS CRM/Forms/RBAC/Billing Schema
-- ===========================================

-- ワークスペース（テナント）
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ユーザープロファイル
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ワークスペースメンバー（権限管理）
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 顧客（CRM）
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
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
  created_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 顧客タグ定義
CREATE TABLE IF NOT EXISTS customer_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  color TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, name)
);

-- 顧客タグ割り当て
CREATE TABLE IF NOT EXISTS customer_tag_assignments (
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES customer_tags(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(customer_id, tag_id)
);

-- 顧客行動ログ
CREATE TABLE IF NOT EXISTS client_activity_log (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON COLUMN client_activity_log.details IS 'PIIを含めない。ID参照のみ記録';

-- フォーム
CREATE TABLE IF NOT EXISTS forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  schema JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  template_id TEXT,
  created_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

-- フォーム送信データ
CREATE TABLE IF NOT EXISTS form_submissions (
  id BIGSERIAL PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
  respondent_email TEXT,
  respondent_name TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- 決済記録
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
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
  created_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, invoice_number)
);

-- 権限セット（RBAC拡張）
CREATE TABLE IF NOT EXISTS permission_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_role TEXT NOT NULL DEFAULT 'member' CHECK (base_role IN ('member', 'admin', 'owner')),
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, name)
);

-- メンバー別権限オーバーライド
CREATE TABLE IF NOT EXISTS member_permission_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  permission_set_id UUID REFERENCES permission_sets(id) ON DELETE SET NULL,
  custom_permissions JSONB DEFAULT '{}',
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Gmail 監視設定
CREATE TABLE IF NOT EXISTS gmail_watch_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL UNIQUE,
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
  configured_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Gmail 処理済みメッセージ
CREATE TABLE IF NOT EXISTS gmail_processed_messages (
  id BIGSERIAL PRIMARY KEY,
  config_id UUID REFERENCES gmail_watch_configs(id) ON DELETE CASCADE NOT NULL,
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
CREATE TABLE IF NOT EXISTS payment_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  message_id BIGINT REFERENCES gmail_processed_messages(id) NOT NULL,
  payment_id UUID REFERENCES payments(id) NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low', 'none')),
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  match_reasons JSONB NOT NULL DEFAULT '[]',
  parsed_amount NUMERIC(12,4),
  parsed_payer_name TEXT,
  parsed_transfer_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'auto_confirmed')),
  confirmed_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, payment_id)
);

-- 監査ログ
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES profiles(id) NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE audit_log IS '365日ホット保持、法的要件で最低3年保持';
