-- 003_feature_flags.sql
-- ワークスペース単位のフィーチャートグル

CREATE TABLE workspace_feature_flags (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES profiles(id),
  PRIMARY KEY(workspace_id, feature_key)
);
