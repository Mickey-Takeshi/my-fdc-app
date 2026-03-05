-- =============================================================================
-- FDC Modular Starter - Row Level Security Policies
-- Phase 20: Security
--
-- IMPORTANT: Execute these statements in the Supabase SQL Editor.
-- The service role key used in API routes bypasses RLS automatically.
-- These policies protect direct client-side access via Supabase anon key.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: workspace_members lookup
-- Users can only access data within workspaces they belong to.
-- -----------------------------------------------------------------------------

-- =============================================================================
-- 1. workspaces
-- =============================================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workspaces"
  ON workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Workspace owners can update their workspaces"
  ON workspaces FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'OWNER'
    )
  );

CREATE POLICY "Workspace owners can delete their workspaces"
  ON workspaces FOR DELETE
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'OWNER'
    )
  );

-- =============================================================================
-- 2. workspace_members
-- =============================================================================
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members in their workspaces"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can add members to their workspaces"
  ON workspace_members FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Admins can update members in their workspaces"
  ON workspace_members FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Admins can remove members from their workspaces"
  ON workspace_members FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
    )
  );

-- =============================================================================
-- 3. tasks
-- =============================================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their workspaces"
  ON tasks FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their workspaces"
  ON tasks FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their workspaces"
  ON tasks FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their workspaces"
  ON tasks FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 4. brands
-- =============================================================================
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view brands in their workspaces"
  ON brands FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create brands in their workspaces"
  ON brands FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update brands in their workspaces"
  ON brands FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete brands in their workspaces"
  ON brands FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 5. brand_points
-- =============================================================================
ALTER TABLE brand_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view brand_points via brand workspace"
  ON brand_points FOR SELECT
  USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create brand_points via brand workspace"
  ON brand_points FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update brand_points via brand workspace"
  ON brand_points FOR UPDATE
  USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete brand_points via brand workspace"
  ON brand_points FOR DELETE
  USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN workspace_members wm ON wm.workspace_id = b.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 6. lean_canvas
-- =============================================================================
ALTER TABLE lean_canvas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lean_canvas in their workspaces"
  ON lean_canvas FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create lean_canvas in their workspaces"
  ON lean_canvas FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lean_canvas in their workspaces"
  ON lean_canvas FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lean_canvas in their workspaces"
  ON lean_canvas FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 7. lean_canvas_blocks
-- =============================================================================
ALTER TABLE lean_canvas_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lean_canvas_blocks via canvas workspace"
  ON lean_canvas_blocks FOR SELECT
  USING (
    canvas_id IN (
      SELECT lc.id FROM lean_canvas lc
      JOIN workspace_members wm ON wm.workspace_id = lc.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create lean_canvas_blocks via canvas workspace"
  ON lean_canvas_blocks FOR INSERT
  WITH CHECK (
    canvas_id IN (
      SELECT lc.id FROM lean_canvas lc
      JOIN workspace_members wm ON wm.workspace_id = lc.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lean_canvas_blocks via canvas workspace"
  ON lean_canvas_blocks FOR UPDATE
  USING (
    canvas_id IN (
      SELECT lc.id FROM lean_canvas lc
      JOIN workspace_members wm ON wm.workspace_id = lc.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lean_canvas_blocks via canvas workspace"
  ON lean_canvas_blocks FOR DELETE
  USING (
    canvas_id IN (
      SELECT lc.id FROM lean_canvas lc
      JOIN workspace_members wm ON wm.workspace_id = lc.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 8. mvv
-- =============================================================================
ALTER TABLE mvv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mvv in their workspaces"
  ON mvv FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create mvv in their workspaces"
  ON mvv FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update mvv in their workspaces"
  ON mvv FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete mvv in their workspaces"
  ON mvv FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 9. invitations
-- =============================================================================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invitations in their workspaces"
  ON invitations FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Admins can create invitations in their workspaces"
  ON invitations FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Admins can update invitations in their workspaces"
  ON invitations FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Admins can delete invitations in their workspaces"
  ON invitations FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
    )
  );

-- =============================================================================
-- 10. audit_logs
-- =============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit_logs in their workspaces"
  ON audit_logs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Authenticated users can create audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- audit_logs are append-only: no UPDATE or DELETE policies

-- =============================================================================
-- 11. system_metrics
-- =============================================================================
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- system_metrics are accessible only via service role (Super Admin API routes)
-- No RLS policies for anon key access

CREATE POLICY "No direct access to system_metrics"
  ON system_metrics FOR SELECT
  USING (false);

-- =============================================================================
-- End of RLS Policies
-- =============================================================================
