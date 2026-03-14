-- 004_rls_policies.sql
-- RLS有効化（サーバーサイド制御が主、RLSは多層防御として補助）

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数
-- SECURITY DEFINER は呼び出し元の権限ではなく関数作成者の権限で実行される
-- search_path を明示して権限昇格攻撃を防止する
CREATE OR REPLACE FUNCTION get_user_role(ws_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM workspace_members
  WHERE workspace_id = ws_id AND user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public;

-- ワークスペースメンバーのみアクセス可
CREATE POLICY "workspace_access" ON customers
  FOR SELECT USING (get_user_role(workspace_id) IS NOT NULL);

CREATE POLICY "workspace_write" ON customers
  FOR INSERT WITH CHECK (
    get_user_role(workspace_id) IN ('owner', 'admin', 'member')
  );
