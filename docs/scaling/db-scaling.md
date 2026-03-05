# Phase 68: DB Scaling Design

> FDC Modular Starter - データベーススケーリング設計

---

## 1. Index Strategy (インデックス戦略)

### 1.1 現在のFDCインデックス

`docs/sql/query-optimization.sql` で定義済みのインデックス:

| テーブル | インデックス名 | カラム | 用途 |
|---------|--------------|--------|------|
| tasks | idx_tasks_workspace_status | (workspace_id, status) | ステータス別タスク取得 |
| tasks | idx_tasks_workspace_date | (workspace_id, scheduled_date) | カレンダービュー |
| brands | idx_brands_workspace | (workspace_id) | ワークスペース別ブランド |
| brand_points | idx_brand_points_brand | (brand_id) | ブランド別ポイント |
| lean_canvas | idx_lean_canvas_workspace | (workspace_id) | ワークスペース別キャンバス |
| lean_canvas_blocks | idx_lean_canvas_blocks_canvas | (canvas_id) | キャンバス別ブロック |
| mvv | idx_mvv_brand | (brand_id) | ブランド別MVV |
| audit_logs | idx_audit_logs_workspace_time | (workspace_id, created_at DESC) | 管理画面監査ログ |
| invitations | idx_invitations_workspace | (workspace_id) | ワークスペース別招待 |
| workspace_members | idx_workspace_members_user | (user_id) | 認証チェック |
| ai_usage_logs | idx_ai_usage_logs_workspace | (workspace_id, created_at DESC) | AI利用量 |
| ai_usage_logs | idx_ai_usage_logs_user | (user_id, created_at DESC) | ユーザー別AI利用量 |
| ai_usage_logs | idx_ai_usage_logs_feature | (feature, created_at DESC) | 機能別AI利用量 |

### 1.2 追加推奨インデックス

スケーリング時に追加すべきインデックス:

```sql
-- Leads: ステータス + 更新日（ファネルビュー最適化）
CREATE INDEX IF NOT EXISTS idx_leads_workspace_status_updated
  ON leads(workspace_id, status, updated_at DESC);

-- Leads: 検索用（名前・会社名の部分一致）
CREATE INDEX IF NOT EXISTS idx_leads_workspace_name
  ON leads(workspace_id, company_name, contact_name);

-- Clients: ワークスペース + 作成日
CREATE INDEX IF NOT EXISTS idx_clients_workspace_created
  ON clients(workspace_id, created_at DESC);

-- Approaches: リード + 日付（タイムライン表示）
CREATE INDEX IF NOT EXISTS idx_approaches_lead_date
  ON approaches(lead_id, approach_date DESC);

-- Action Maps: ワークスペース + ステータス
CREATE INDEX IF NOT EXISTS idx_action_maps_workspace_status
  ON action_maps(workspace_id, status);

-- Action Items: マップ + 順序
CREATE INDEX IF NOT EXISTS idx_action_items_map_order
  ON action_items(action_map_id, sort_order);

-- Objectives: ワークスペース + 期間
CREATE INDEX IF NOT EXISTS idx_objectives_workspace_period
  ON objectives(workspace_id, period);

-- Key Results: 目標 + 進捗
CREATE INDEX IF NOT EXISTS idx_key_results_objective
  ON key_results(objective_id);

-- Tasks: 象限ビュー最適化（4象限表示用）
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_quadrant
  ON tasks(workspace_id, quadrant, sort_order);

-- Subscriptions: 課金状態の高速参照
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace_status
  ON subscriptions(workspace_id, status);

-- 部分インデックス: アクティブなタスクのみ
CREATE INDEX IF NOT EXISTS idx_tasks_active
  ON tasks(workspace_id, updated_at DESC)
  WHERE status != 'completed' AND status != 'archived';

-- 部分インデックス: 未処理の招待のみ
CREATE INDEX IF NOT EXISTS idx_invitations_pending
  ON invitations(workspace_id, created_at DESC)
  WHERE status = 'pending';
```

### 1.3 インデックス設計ルール

| 優先度 | ルール | 説明 |
|--------|-------|------|
| **1** | 高カーディナリティ列を先頭に | workspace_id, user_id を先頭カラムに |
| **2** | WHERE句のカラムを含める | フィルター条件で使用するカラム |
| **3** | ORDER BY とアラインメント | ソート方向（ASC/DESC）をインデックスと一致させる |
| **4** | 部分インデックスの活用 | WHERE句でアクティブなレコードのみ対象にする |
| **5** | カバリングインデックス検討 | INCLUDE句で必要カラムを含め、テーブルアクセスを回避 |
| **6** | 複合インデックスは3カラム以下 | カラム数が多すぎると更新コストが増大 |

### 1.4 インデックスメンテナンススケジュール

| 頻度 | 作業 | コマンド |
|------|------|---------|
| **毎日** | インデックス使用統計確認 | `pg_stat_user_indexes` で idx_scan = 0 のインデックスを検出 |
| **週次** | ANALYZE 実行 | `ANALYZE tablename;` で統計情報を更新 |
| **月次** | REINDEX 検討 | `REINDEX INDEX CONCURRENTLY idx_name;` で断片化解消 |
| **四半期** | 未使用インデックス削除 | 3ヶ月間 idx_scan = 0 のインデックスを DROP |

```sql
-- 未使用インデックスの検出クエリ
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS scan_count,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE 'pg_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- インデックスの断片化状況
SELECT
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
```

---

## 2. Query Optimization (クエリ最適化)

### 2.1 スロークエリの特定

#### EXPLAIN ANALYZE の活用

```sql
-- 実行計画の確認（本番では ANALYZE に注意 - 実際にクエリが実行される）
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT t.*, wm.role
FROM tasks t
JOIN workspace_members wm ON wm.workspace_id = t.workspace_id
WHERE t.workspace_id = 'uuid-here'
  AND t.status = 'active'
ORDER BY t.updated_at DESC
LIMIT 50;
```

#### 実行計画の読み方

| 項目 | 目標値 | 問題の兆候 |
|------|--------|-----------|
| **Seq Scan** | 小テーブルのみ許容 | 1000行以上のテーブルでSeq Scanは要改善 |
| **actual time** | < 10ms | 100ms超えは要改善 |
| **rows** | 見積もりと実績が近い | 10倍以上の乖離は統計情報が古い |
| **Buffers shared hit** | read より多い | read が多い場合はキャッシュ効率が悪い |
| **Sort Method** | quicksort (Memory) | external merge (Disk) は要改善 |

#### pg_stat_statements によるスロークエリ検出

```sql
-- 上位10件のスロークエリ
SELECT
  substring(query, 1, 100) AS short_query,
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round(stddev_exec_time::numeric, 2) AS stddev_ms,
  rows
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- 100ms以上
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 2.2 N+1 クエリの解消（FDCエンティティ別）

#### Tasks（タスク）

```typescript
// NG: N+1 パターン
const tasks = await supabase.from('tasks').select('*').eq('workspace_id', wsId);
for (const task of tasks.data) {
  const user = await supabase.from('profiles').select('*').eq('id', task.user_id);
  // 各タスクごとにプロフィールを取得 -> N回のクエリ
}

// OK: JOIN パターン
const { data } = await supabase
  .from('tasks')
  .select('*, profiles!tasks_user_id_fkey(display_name, avatar_url)')
  .eq('workspace_id', wsId)
  .order('updated_at', { ascending: false })
  .limit(50);
```

#### Brands（ブランド）

```typescript
// NG: ブランドごとにポイントを取得
const brands = await supabase.from('brands').select('*').eq('workspace_id', wsId);
for (const brand of brands.data) {
  const points = await supabase.from('brand_points').select('*').eq('brand_id', brand.id);
}

// OK: ネストされたセレクトで一括取得
const { data } = await supabase
  .from('brands')
  .select('*, brand_points(*), mvv(*)')
  .eq('workspace_id', wsId);
```

#### Workspaces（ワークスペース）

```typescript
// NG: ワークスペースごとにメンバーを取得
const workspaces = await supabase.from('workspaces').select('*');
for (const ws of workspaces.data) {
  const members = await supabase.from('workspace_members').select('*').eq('workspace_id', ws.id);
}

// OK: JOIN で一括取得
const { data } = await supabase
  .from('workspaces')
  .select('*, workspace_members(user_id, role, profiles(display_name))')
  .in('id', workspaceIds);
```

### 2.3 クエリ最適化チェックリスト

- [ ] SELECT * を使用していない（必要なカラムのみ指定）
- [ ] WHERE句にインデックス付きカラムを使用
- [ ] JOIN条件にインデックスが存在する
- [ ] LIMIT/OFFSET でページネーションを実装
- [ ] N+1パターンをSupabase JOINに変換済み
- [ ] 大量データの集計にはマテリアライズドビューを検討
- [ ] EXPLAIN ANALYZEで実行計画を確認済み
- [ ] 部分一致検索（LIKE '%...%'）を全文検索に置換検討

---

## 3. Connection Pool Design (コネクションプール設計)

### 3.1 現在の設定 vs 推奨設定

| 項目 | 現在（Supabase デフォルト） | 推奨（スケーリング時） |
|------|--------------------------|---------------------|
| **接続モード** | Transaction | 環境別に設定 |
| **プールサイズ** | 15（Free Plan） | 60-100（Pro Plan） |
| **最大クライアント接続** | 200 | 400 |
| **アイドルタイムアウト** | 30s | 60s |
| **接続タイムアウト** | 8s | 5s |
| **PgBouncer** | 有効 | 有効 |

### 3.2 プールモード別設定

| モード | 用途 | 特徴 | FDC推奨環境 |
|--------|------|------|------------|
| **Session** | 開発環境 | クライアントが切断するまで接続を保持 | ローカル開発 |
| **Transaction** | 本番環境 | トランザクション終了時に接続をプールに返却 | Vercel本番 |
| **Statement** | 読み取り専用 | ステートメント終了時に接続を返却 | リードレプリカ |

#### Supabase接続文字列の設定

```typescript
// lib/server/supabase.ts

// 直接接続（マイグレーション・管理用）
const DIRECT_URL = process.env.SUPABASE_DB_URL;
// postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

// プール接続（アプリケーション用）
const POOLED_URL = process.env.SUPABASE_DB_POOLED_URL;
// postgresql://postgres.[ref]:[password]@xxx-pooler.supabase.com:6543/postgres
```

### 3.3 接続モニタリング閾値

| メトリクス | 正常 | 警告 | 危険 |
|-----------|------|------|------|
| **アクティブ接続数** | < 60% | 60-80% | > 80% |
| **接続待ち数** | 0 | 1-5 | > 5 |
| **接続取得時間** | < 10ms | 10-50ms | > 50ms |
| **アイドル接続数** | < 30% | 30-50% | > 50% |
| **接続エラー率** | 0% | < 0.1% | > 0.1% |

```sql
-- アクティブ接続数の確認
SELECT
  state,
  count(*) AS connections,
  round(100.0 * count(*) / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'), 1) AS percentage
FROM pg_stat_activity
GROUP BY state
ORDER BY connections DESC;

-- 長時間アイドル接続の検出
SELECT
  pid,
  usename,
  state,
  now() - state_change AS idle_duration,
  query
FROM pg_stat_activity
WHERE state = 'idle'
  AND now() - state_change > interval '5 minutes'
ORDER BY idle_duration DESC;
```

---

## 4. Read Replica Design (リードレプリカ設計)

### 4.1 リードレプリカ使用基準

| 条件 | 閾値 | 対応 |
|------|------|------|
| 読み取り比率が高い | 読み取り/書き込み > 10:1 | レプリカ導入検討 |
| プライマリの CPU使用率 | 常時 70% 超 | レプリカ導入 |
| 分析クエリの影響 | レポート生成が本番に影響 | レプリカ必須 |
| ユーザー数 | 1000 DAU 超 | レプリカ推奨 |

### 4.2 ルーティング設計

```
+-------------------+     +-------------------+
|   Application     |     |   Application     |
|   (Write Path)    |     |   (Read Path)     |
+--------+----------+     +--------+----------+
         |                          |
         v                          v
+--------+----------+     +--------+----------+
|   Primary DB      |---->|   Read Replica    |
|   (Supabase)      | rep |   (Supabase)      |
|                   | lag |                   |
| - INSERT/UPDATE   |     | - SELECT          |
| - DELETE          |     | - Analytics       |
| - Transactions    |     | - Reports         |
+-------------------+     +-------------------+
```

#### ルーティングルール

| 操作 | ルーティング先 | 理由 |
|------|--------------|------|
| **タスク作成/更新/削除** | Primary | 書き込み操作 |
| **タスク一覧取得** | Replica | 読み取り負荷分散 |
| **ダッシュボード表示** | Replica | 集計クエリの負荷分散 |
| **監査ログ参照** | Replica | 大量データの読み取り |
| **リアルタイム通知** | Primary | 最新データが必要 |
| **レポート生成** | Replica | 重いクエリの隔離 |
| **認証・権限チェック** | Primary | 整合性が重要 |

#### Supabase でのレプリカ設定

```typescript
// lib/server/db-router.ts

type QueryType = 'read' | 'write';

function getSupabaseClient(queryType: QueryType) {
  if (queryType === 'write') {
    // Primary: 書き込み用
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Replica: 読み取り用（レプリカが有効な場合）
  const replicaUrl = process.env.SUPABASE_REPLICA_URL;
  if (replicaUrl) {
    return createClient(
      replicaUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // フォールバック: Primaryを使用
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

### 4.3 レプリケーションラグ対策

| 対策 | 説明 | 適用場面 |
|------|------|---------|
| **Write-then-Read** | 書き込み直後の読み取りはPrimaryから | タスク作成後の一覧表示 |
| **Session Stickiness** | 同一セッション内はPrimaryを維持 | 連続操作時 |
| **ラグモニタリング** | レプリケーションラグを監視 | 常時 |
| **フォールバック** | ラグが閾値超過時にPrimaryへ切替 | ラグ > 5s |

```sql
-- レプリケーションラグの確認
SELECT
  now() - pg_last_xact_replay_timestamp() AS replication_lag;

-- レプリカの状態確認
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  write_lag,
  flush_lag,
  replay_lag
FROM pg_stat_replication;
```

---

## 5. Performance Goals (パフォーマンス目標)

### 5.1 クエリパフォーマンス目標

| メトリクス | 目標値 | 計測方法 |
|-----------|--------|---------|
| **P95 クエリレイテンシ** | < 100ms | pg_stat_statements の percentile_disc(0.95) |
| **P99 クエリレイテンシ** | < 500ms | pg_stat_statements の percentile_disc(0.99) |
| **スロークエリ率**（> 1s） | < 0.1% | スロークエリログの比率 |
| **接続取得時間** | < 50ms | PgBouncer stats |
| **インデックスヒット率** | > 99% | pg_stat_user_indexes |
| **キャッシュヒット率** | > 95% | pg_stat_database の blks_hit/(blks_hit+blks_read) |

### 5.2 パフォーマンス計測クエリ

```sql
-- キャッシュヒット率
SELECT
  datname,
  round(100.0 * blks_hit / nullif(blks_hit + blks_read, 0), 2) AS cache_hit_ratio
FROM pg_stat_database
WHERE datname = current_database();

-- テーブル別インデックス使用率
SELECT
  relname AS table_name,
  seq_scan,
  idx_scan,
  CASE WHEN seq_scan + idx_scan > 0
    THEN round(100.0 * idx_scan / (seq_scan + idx_scan), 2)
    ELSE 0
  END AS index_usage_pct
FROM pg_stat_user_tables
WHERE seq_scan + idx_scan > 0
ORDER BY seq_scan DESC;

-- P95/P99 レイテンシの推定
SELECT
  substring(query, 1, 80) AS short_query,
  calls,
  round(min_exec_time::numeric, 2) AS min_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round(max_exec_time::numeric, 2) AS max_ms,
  round(stddev_exec_time::numeric, 2) AS stddev_ms
FROM pg_stat_statements
WHERE calls > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 5.3 スケーリングトリガー

| 指標 | 現在の閾値 | アクション |
|------|-----------|-----------|
| **P95 > 100ms** | 連続 1時間 | インデックス見直し + クエリ最適化 |
| **P99 > 500ms** | 連続 30分 | 緊急クエリチューニング |
| **接続使用率 > 80%** | 連続 15分 | プールサイズ拡張 |
| **キャッシュヒット率 < 95%** | 連続 1時間 | shared_buffers 調整検討 |
| **スロークエリ率 > 0.1%** | 日次チェック | 個別クエリ最適化 |
| **DB CPU > 70%** | 連続 30分 | リードレプリカ導入検討 |

---

## 6. Implementation Checklist (実装チェックリスト)

### Phase 68 導入順序

- [ ] **Step 1**: 追加推奨インデックスの適用（Section 1.2）
- [ ] **Step 2**: pg_stat_statements の有効化と初回スロークエリ分析
- [ ] **Step 3**: N+1クエリの検出と修正（Section 2.2）
- [ ] **Step 4**: Supabase PgBouncer設定の最適化
- [ ] **Step 5**: 接続モニタリングダッシュボードの構築
- [ ] **Step 6**: パフォーマンスベースラインの計測と記録
- [ ] **Step 7**: インデックスメンテナンスの自動化（cron設定）
- [ ] **Step 8**: リードレプリカ導入の判断基準モニタリング開始

### 運用開始後の定期タスク

| 頻度 | タスク |
|------|-------|
| 毎日 | スロークエリログ確認 |
| 週次 | インデックス使用状況レビュー |
| 月次 | REINDEX + VACUUM ANALYZE |
| 四半期 | パフォーマンス目標の達成状況レビュー |

---

**Last Updated**: 2026-03-05
**Phase**: 68
**Status**: Design Complete
