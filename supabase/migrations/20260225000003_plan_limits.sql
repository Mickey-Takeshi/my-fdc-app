-- ===========================================
-- Plan limit triggers (Chapter 6)
-- ===========================================

-- ワークスペースのメンバー数チェックトリガー
CREATE OR REPLACE FUNCTION check_workspace_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  plan_name TEXT;
  max_allowed INTEGER;
BEGIN
  SELECT w.plan INTO plan_name FROM workspaces w WHERE w.id = NEW.workspace_id;
  max_allowed := CASE plan_name
    WHEN 'free' THEN 3
    WHEN 'pro' THEN 20
    WHEN 'enterprise' THEN -1
    ELSE 3
  END;
  IF max_allowed = -1 THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO current_count FROM workspace_members WHERE workspace_id = NEW.workspace_id;
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'メンバー数上限に達しています。プランをアップグレードしてください。';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_member_limit
  BEFORE INSERT ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION check_workspace_member_limit();
