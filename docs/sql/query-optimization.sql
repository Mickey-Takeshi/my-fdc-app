-- Query Optimization Reference (Phase 35)
-- Execute via Supabase SQL Editor

-- ============================================
-- 1. Analyze slow queries
-- ============================================

-- Enable pg_stat_statements (if not enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 slowest queries by mean execution time
-- SELECT query, calls, total_exec_time, mean_exec_time
-- FROM pg_stat_statements
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- ============================================
-- 2. Check index usage
-- ============================================

-- Unused indexes (candidates for removal)
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- ============================================
-- 3. Table sizes
-- ============================================

SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS data_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size,
  n_live_tup AS row_count
FROM pg_catalog.pg_statio_user_tables
JOIN pg_stat_user_tables USING (relid)
ORDER BY pg_total_relation_size(relid) DESC;

-- ============================================
-- 4. Recommended indexes for FDC
-- ============================================

-- Tasks: workspace + status (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status
  ON tasks(workspace_id, status);

-- Tasks: workspace + scheduled_date (calendar view)
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_date
  ON tasks(workspace_id, scheduled_date);

-- Brands: workspace lookup
CREATE INDEX IF NOT EXISTS idx_brands_workspace
  ON brands(workspace_id);

-- Brand points: brand lookup
CREATE INDEX IF NOT EXISTS idx_brand_points_brand
  ON brand_points(brand_id);

-- Lean canvas: workspace lookup
CREATE INDEX IF NOT EXISTS idx_lean_canvas_workspace
  ON lean_canvas(workspace_id);

-- Lean canvas blocks: canvas lookup
CREATE INDEX IF NOT EXISTS idx_lean_canvas_blocks_canvas
  ON lean_canvas_blocks(canvas_id);

-- MVV: brand lookup
CREATE INDEX IF NOT EXISTS idx_mvv_brand
  ON mvv(brand_id);

-- Audit logs: workspace + time (admin page query)
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_time
  ON audit_logs(workspace_id, created_at DESC);

-- Invitations: workspace lookup
CREATE INDEX IF NOT EXISTS idx_invitations_workspace
  ON invitations(workspace_id);

-- Workspace members: user lookup (auth check)
CREATE INDEX IF NOT EXISTS idx_workspace_members_user
  ON workspace_members(user_id);

-- ============================================
-- 5. N+1 Query Pattern Examples (Supabase JS)
-- ============================================

-- BAD: N+1 pattern (DO NOT USE)
-- for (const ws of workspaces) {
--   const members = await supabase
--     .from('workspace_members')
--     .select('*')
--     .eq('workspace_id', ws.id);
-- }

-- GOOD: JOIN pattern (USE THIS)
-- const { data } = await supabase
--   .from('workspaces')
--   .select('id, name, workspace_members(user_id, role)')
--   .eq('workspace_members.user_id', userId);

-- ============================================
-- 6. Pagination pattern
-- ============================================

-- const page = 1;
-- const pageSize = 50;
-- const offset = (page - 1) * pageSize;
--
-- const { data, count } = await supabase
--   .from('tasks')
--   .select('*', { count: 'exact' })
--   .eq('workspace_id', workspaceId)
--   .order('created_at', { ascending: false })
--   .range(offset, offset + pageSize - 1);
