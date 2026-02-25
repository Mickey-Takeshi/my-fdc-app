-- ===========================================
-- Triggers, Indexes, and RLS policies
-- ===========================================

-- ============================================
-- 1. updated_at 自動更新トリガー
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'workspaces', 'profiles', 'customers', 'customer_tags',
    'forms', 'payments', 'permission_sets', 'member_permission_overrides',
    'gmail_watch_configs', 'payment_matches'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl
    );
  END LOOP;
END;
$$;

-- ============================================
-- 2. インデックス
-- ============================================

-- 顧客
CREATE INDEX idx_customers_workspace ON customers(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_status ON customers(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_followup ON customers(next_followup_at) WHERE next_followup_at IS NOT NULL;
CREATE INDEX idx_customers_metadata ON customers USING GIN (metadata jsonb_path_ops);

-- 顧客タグ
CREATE INDEX idx_customer_tags_workspace ON customer_tags(workspace_id);
CREATE INDEX idx_tag_assignments_tag ON customer_tag_assignments(tag_id);

-- 行動ログ
CREATE INDEX idx_activity_log_workspace ON client_activity_log(workspace_id, created_at DESC);
CREATE INDEX idx_activity_log_customer ON client_activity_log(customer_id);

-- フォーム
CREATE INDEX idx_forms_workspace ON forms(workspace_id);
CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_submissions_submitted ON form_submissions(submitted_at DESC);
CREATE INDEX idx_submissions_email ON form_submissions(respondent_email) WHERE respondent_email IS NOT NULL;
CREATE INDEX idx_submissions_answers ON form_submissions USING GIN (answers);

-- 決済
CREATE INDEX idx_payments_workspace ON payments(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_due_date ON payments(workspace_id, due_date) WHERE status IN ('pending');
CREATE INDEX idx_payments_gmail ON payments(gmail_message_id) WHERE gmail_message_id IS NOT NULL;

-- 権限
CREATE INDEX idx_permission_sets_workspace ON permission_sets(workspace_id);
CREATE INDEX idx_member_overrides_workspace ON member_permission_overrides(workspace_id);
CREATE INDEX idx_member_overrides_user ON member_permission_overrides(user_id);

-- ワークスペースメンバー
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace_role ON workspace_members(workspace_id, role);

-- Gmail
CREATE INDEX idx_processed_messages_config ON gmail_processed_messages(config_id);
CREATE INDEX idx_processed_messages_status ON gmail_processed_messages(match_status);
CREATE INDEX idx_payment_matches_workspace ON payment_matches(workspace_id);
CREATE INDEX idx_payment_matches_status ON payment_matches(status);

-- 監査ログ
CREATE INDEX idx_audit_log_workspace ON audit_log(workspace_id, created_at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- ============================================
-- 3. RLS（補助的。サーバーサイド制御が主）
-- ============================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_watch_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_processed_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_activity_log ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数
CREATE OR REPLACE FUNCTION get_user_role(ws_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM workspace_members
  WHERE workspace_id = ws_id AND user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- プロファイル
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ワークスペース
CREATE POLICY "workspaces_select_member" ON workspaces
  FOR SELECT USING (get_user_role(id) IS NOT NULL);
CREATE POLICY "workspaces_insert_auth" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "workspaces_update_owner" ON workspaces
  FOR UPDATE USING (get_user_role(id) = 'owner');

-- ワークスペースメンバー
CREATE POLICY "members_select_member" ON workspace_members
  FOR SELECT USING (get_user_role(workspace_id) IS NOT NULL);
CREATE POLICY "members_insert_admin" ON workspace_members
  FOR INSERT WITH CHECK (
    get_user_role(workspace_id) IN ('owner', 'admin')
    OR (user_id = auth.uid() AND role = 'owner')
  );
CREATE POLICY "members_update_admin" ON workspace_members
  FOR UPDATE USING (get_user_role(workspace_id) IN ('owner', 'admin'));
CREATE POLICY "members_delete_admin" ON workspace_members
  FOR DELETE USING (get_user_role(workspace_id) IN ('owner', 'admin'));

-- 顧客
CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (get_user_role(workspace_id) IS NOT NULL);
CREATE POLICY "customers_insert" ON customers
  FOR INSERT WITH CHECK (get_user_role(workspace_id) IN ('owner', 'admin', 'member'));
CREATE POLICY "customers_update" ON customers
  FOR UPDATE USING (get_user_role(workspace_id) IN ('owner', 'admin', 'member'));

-- フォーム
CREATE POLICY "forms_select" ON forms
  FOR SELECT USING (get_user_role(workspace_id) IS NOT NULL);
CREATE POLICY "forms_insert" ON forms
  FOR INSERT WITH CHECK (get_user_role(workspace_id) IN ('owner', 'admin'));
CREATE POLICY "forms_update" ON forms
  FOR UPDATE USING (get_user_role(workspace_id) IN ('owner', 'admin'));

-- 決済
CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (get_user_role(workspace_id) IS NOT NULL);
CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (get_user_role(workspace_id) IN ('owner', 'admin'));

-- 監査ログ
CREATE POLICY "audit_log_select_admin" ON audit_log
  FOR SELECT USING (get_user_role(workspace_id) IN ('owner', 'admin'));
CREATE POLICY "audit_log_insert_member" ON audit_log
  FOR INSERT WITH CHECK (get_user_role(workspace_id) IS NOT NULL);
