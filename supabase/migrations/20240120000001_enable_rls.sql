-- ===========================================
-- Phase 20: Row Level Security (RLS) 設定
-- ===========================================

-- ============================================
-- 1. users テーブル
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 自分自身のレコードのみ参照可能
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- 自分自身のレコードのみ更新可能
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid());

-- ============================================
-- 2. workspaces テーブル
-- ============================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- メンバーのみワークスペースを参照可能
CREATE POLICY "Members can view workspace"
ON workspaces FOR SELECT
USING (
  id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- 認証済みユーザーは新規作成可能
CREATE POLICY "Authenticated users can create workspace"
ON workspaces FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- オーナーのみ更新可能
CREATE POLICY "Owner can update workspace"
ON workspaces FOR UPDATE
USING (
  id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role = 'OWNER'
  )
);

-- オーナーのみ削除可能
CREATE POLICY "Owner can delete workspace"
ON workspaces FOR DELETE
USING (
  id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role = 'OWNER'
  )
);

-- ============================================
-- 3. workspace_members テーブル
-- ============================================
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- メンバーは同じワークスペースのメンバー一覧を参照可能
CREATE POLICY "Members can view workspace members"
ON workspace_members FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ADMIN以上のみメンバー追加可能
CREATE POLICY "Admin can add members"
ON workspace_members FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ADMIN以上のみメンバー更新可能
CREATE POLICY "Admin can update members"
ON workspace_members FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ADMIN以上のみメンバー削除可能
CREATE POLICY "Admin can remove members"
ON workspace_members FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ============================================
-- 4. tasks テーブル
-- ============================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- メンバーのみ参照可能
CREATE POLICY "Members can view tasks"
ON tasks FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- メンバーのみ作成可能
CREATE POLICY "Members can create tasks"
ON tasks FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- メンバーのみ更新可能
CREATE POLICY "Members can update tasks"
ON tasks FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- メンバーのみ削除可能
CREATE POLICY "Members can delete tasks"
ON tasks FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 5. brands テーブル
-- ============================================
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view brands"
ON brands FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can create brands"
ON brands FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can update brands"
ON brands FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete brands"
ON brands FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 6. brand_mvv テーブル
-- ============================================
ALTER TABLE brand_mvv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view brand_mvv"
ON brand_mvv FOR SELECT
USING (
  brand_id IN (
    SELECT b.id FROM brands b
    JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage brand_mvv"
ON brand_mvv FOR ALL
USING (
  brand_id IN (
    SELECT b.id FROM brands b
    JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

-- ============================================
-- 7. leads テーブル
-- ============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view leads"
ON leads FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can create leads"
ON leads FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can update leads"
ON leads FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete leads"
ON leads FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 8. clients テーブル
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view clients"
ON clients FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can create clients"
ON clients FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can update clients"
ON clients FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete clients"
ON clients FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 9. objectives テーブル (OKR)
-- ============================================
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view objectives"
ON objectives FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage objectives"
ON objectives FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 10. key_results テーブル (OKR)
-- ============================================
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view key_results"
ON key_results FOR SELECT
USING (
  objective_id IN (
    SELECT o.id FROM objectives o
    JOIN workspace_members wm ON o.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage key_results"
ON key_results FOR ALL
USING (
  objective_id IN (
    SELECT o.id FROM objectives o
    JOIN workspace_members wm ON o.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

-- ============================================
-- 11. action_maps テーブル
-- ============================================
ALTER TABLE action_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view action_maps"
ON action_maps FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage action_maps"
ON action_maps FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 12. action_map_items テーブル
-- ============================================
ALTER TABLE action_map_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view action_map_items"
ON action_map_items FOR SELECT
USING (
  map_id IN (
    SELECT am.id FROM action_maps am
    JOIN workspace_members wm ON am.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage action_map_items"
ON action_map_items FOR ALL
USING (
  map_id IN (
    SELECT am.id FROM action_maps am
    JOIN workspace_members wm ON am.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

-- ============================================
-- 13. lean_canvases テーブル
-- ============================================
ALTER TABLE lean_canvases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view lean_canvases"
ON lean_canvases FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage lean_canvases"
ON lean_canvases FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 14. lean_canvas_blocks テーブル
-- ============================================
ALTER TABLE lean_canvas_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view lean_canvas_blocks"
ON lean_canvas_blocks FOR SELECT
USING (
  canvas_id IN (
    SELECT lc.id FROM lean_canvases lc
    JOIN workspace_members wm ON lc.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage lean_canvas_blocks"
ON lean_canvas_blocks FOR ALL
USING (
  canvas_id IN (
    SELECT lc.id FROM lean_canvases lc
    JOIN workspace_members wm ON lc.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

-- ============================================
-- 15. approaches テーブル
-- ============================================
ALTER TABLE approaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view approaches"
ON approaches FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage approaches"
ON approaches FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 16. goals テーブル
-- ============================================
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view goals"
ON goals FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage goals"
ON goals FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 17. workspace_invitations テーブル
-- ============================================
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- ADMIN以上のみ参照可能
CREATE POLICY "Admin can view invitations"
ON workspace_invitations FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ADMIN以上のみ作成可能
CREATE POLICY "Admin can create invitations"
ON workspace_invitations FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ADMIN以上のみ削除可能
CREATE POLICY "Admin can delete invitations"
ON workspace_invitations FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ============================================
-- 18. sessions テーブル
-- ============================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 自分のセッションのみ参照可能
CREATE POLICY "Users can view own sessions"
ON sessions FOR SELECT
USING (user_id = auth.uid());

-- 自分のセッションのみ削除可能
CREATE POLICY "Users can delete own sessions"
ON sessions FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 19. google_tokens テーブル
-- ============================================
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- 自分のトークンのみ参照可能
CREATE POLICY "Users can view own tokens"
ON google_tokens FOR SELECT
USING (user_id = auth.uid());

-- 自分のトークンのみ管理可能
CREATE POLICY "Users can manage own tokens"
ON google_tokens FOR ALL
USING (user_id = auth.uid());

-- ============================================
-- 20. audit_logs テーブル
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ADMIN以上のみ参照可能
CREATE POLICY "Admin can view audit_logs"
ON audit_logs FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- 挿入は全メンバー可能（ログ記録用）
CREATE POLICY "Members can create audit_logs"
ON audit_logs FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 21. pdca_cycles テーブル
-- ============================================
ALTER TABLE pdca_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pdca_cycles"
ON pdca_cycles FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage pdca_cycles"
ON pdca_cycles FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 22. Super Admin 用テーブル（SA専用）
-- ============================================

-- sa_metrics テーブル（存在する場合のみ）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sa_metrics') THEN
    ALTER TABLE sa_metrics ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "SA can view metrics"
    ON sa_metrics FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND account_type = 'SA'
      )
    );

    CREATE POLICY "SA can manage metrics"
    ON sa_metrics FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND account_type = 'SA'
      )
    );
  END IF;
END $$;

-- sa_security_logs テーブル（存在する場合のみ）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sa_security_logs') THEN
    ALTER TABLE sa_security_logs ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "SA can view security_logs"
    ON sa_security_logs FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND account_type = 'SA'
      )
    );

    CREATE POLICY "SA can manage security_logs"
    ON sa_security_logs FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND account_type = 'SA'
      )
    );
  END IF;
END $$;
