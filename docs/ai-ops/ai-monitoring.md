# Phase 65: AI Monitoring & Cost Management

> FDC Modular Starter - AI Ops: Usage Tracking, Cost Dashboard, Alerts & Limits

---

## 1. Usage Tracking (利用量トラッキング)

### 1.1 トラッキング対象

| 項目 | 単位 | 説明 |
|------|------|------|
| **リクエスト数** | count | API コール回数 |
| **入力トークン** | tokens | プロンプト + システムメッセージのトークン数 |
| **出力トークン** | tokens | レスポンスのトークン数 |
| **コスト** | USD | トークン数 x モデル単価 |
| **レイテンシ** | ms | リクエスト送信からレスポンス完了までの時間 |

### 1.2 集計ディメンション

| ディメンション | 説明 | ユースケース |
|---------------|------|-------------|
| **ユーザー** | user_id 単位 | 個人利用量の把握、利用制限 |
| **ワークスペース** | workspace_id 単位 | テナント別コスト管理 |
| **機能** | feature 単位 | 機能別 ROI 分析 |
| **モデル** | model 単位 | モデル別コスト比較 |
| **日次** | date 単位 | 日別トレンド分析 |
| **月次** | month 単位 | 月次予算管理 |

### 1.3 データベーススキーマ

#### ai_usage_logs (リアルタイムログ)

```sql
CREATE TABLE ai_usage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature         TEXT NOT NULL,           -- 'task_extract', 'okr_suggest', 'chat', 'summarize'
  model           TEXT NOT NULL,           -- 'claude-3-5-sonnet', 'gpt-4o', 'llama-3'
  provider        TEXT NOT NULL,           -- 'anthropic', 'openai', 'groq'
  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,
  total_tokens    INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost_usd        DECIMAL(10, 6) NOT NULL DEFAULT 0,
  latency_ms      INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'success',  -- 'success', 'error', 'timeout', 'rate_limited'
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_ai_usage_logs_workspace ON ai_usage_logs(workspace_id, created_at DESC);
CREATE INDEX idx_ai_usage_logs_user ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_logs_feature ON ai_usage_logs(feature, created_at DESC);
CREATE INDEX idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);

-- RLS
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace usage"
  ON ai_usage_logs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

#### ai_usage_daily (日次集計)

```sql
CREATE TABLE ai_usage_daily (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature         TEXT NOT NULL,
  model           TEXT NOT NULL,
  date            DATE NOT NULL,
  request_count   INTEGER NOT NULL DEFAULT 0,
  input_tokens    BIGINT NOT NULL DEFAULT 0,
  output_tokens   BIGINT NOT NULL DEFAULT 0,
  total_tokens    BIGINT GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost_usd        DECIMAL(10, 4) NOT NULL DEFAULT 0,
  avg_latency_ms  INTEGER NOT NULL DEFAULT 0,
  p95_latency_ms  INTEGER NOT NULL DEFAULT 0,
  error_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(workspace_id, user_id, feature, model, date)
);

-- インデックス
CREATE INDEX idx_ai_usage_daily_workspace_date ON ai_usage_daily(workspace_id, date DESC);
CREATE INDEX idx_ai_usage_daily_user_date ON ai_usage_daily(user_id, date DESC);

-- RLS
ALTER TABLE ai_usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace daily usage"
  ON ai_usage_daily FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

#### ai_usage_monthly (月次集計)

```sql
CREATE TABLE ai_usage_monthly (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature         TEXT NOT NULL,
  model           TEXT NOT NULL,
  month           DATE NOT NULL,             -- 月の初日（例: 2026-03-01）
  request_count   INTEGER NOT NULL DEFAULT 0,
  input_tokens    BIGINT NOT NULL DEFAULT 0,
  output_tokens   BIGINT NOT NULL DEFAULT 0,
  total_tokens    BIGINT GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost_usd        DECIMAL(10, 4) NOT NULL DEFAULT 0,
  avg_latency_ms  INTEGER NOT NULL DEFAULT 0,
  p95_latency_ms  INTEGER NOT NULL DEFAULT 0,
  error_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(workspace_id, user_id, feature, model, month)
);

-- インデックス
CREATE INDEX idx_ai_usage_monthly_workspace ON ai_usage_monthly(workspace_id, month DESC);

-- RLS
ALTER TABLE ai_usage_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace monthly usage"
  ON ai_usage_monthly FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

#### 日次集計バッチ (PostgreSQL Function)

```sql
CREATE OR REPLACE FUNCTION aggregate_ai_usage_daily()
RETURNS void AS $$
BEGIN
  INSERT INTO ai_usage_daily (
    workspace_id, user_id, feature, model, date,
    request_count, input_tokens, output_tokens, cost_usd,
    avg_latency_ms, p95_latency_ms, error_count
  )
  SELECT
    workspace_id,
    user_id,
    feature,
    model,
    DATE(created_at) AS date,
    COUNT(*) AS request_count,
    SUM(input_tokens) AS input_tokens,
    SUM(output_tokens) AS output_tokens,
    SUM(cost_usd) AS cost_usd,
    AVG(latency_ms)::INTEGER AS avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)::INTEGER AS p95_latency_ms,
    COUNT(*) FILTER (WHERE status = 'error') AS error_count
  FROM ai_usage_logs
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY workspace_id, user_id, feature, model, DATE(created_at)
  ON CONFLICT (workspace_id, user_id, feature, model, date)
  DO UPDATE SET
    request_count = EXCLUDED.request_count,
    input_tokens = EXCLUDED.input_tokens,
    output_tokens = EXCLUDED.output_tokens,
    cost_usd = EXCLUDED.cost_usd,
    avg_latency_ms = EXCLUDED.avg_latency_ms,
    p95_latency_ms = EXCLUDED.p95_latency_ms,
    error_count = EXCLUDED.error_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
```

---

## 2. コストダッシュボード設計

### 2.1 表示項目

| 項目 | 表示形式 | 説明 |
|------|---------|------|
| **合計コスト** | 数値 + 前月比 | 今月の累計コスト (USD) |
| **日別トレンド** | 折れ線グラフ | 過去30日間のコスト推移 |
| **モデル別内訳** | 円グラフ | モデル別コスト比率 |
| **機能別内訳** | 棒グラフ | 機能別コスト比較 |
| **トップユーザー** | テーブル | コスト上位ユーザーランキング |
| **レイテンシ** | 数値 + P95 | 平均 / P95 レイテンシ |

### 2.2 ダッシュボードレイアウト

```
+------------------------------------------------------------------+
|  AI Cost Dashboard                                    [March 2026]|
+------------------------------------------------------------------+
|                                                                    |
|  +-- Total Cost --+  +-- Requests --+  +-- Avg Latency --+       |
|  |   $247.83      |  |   12,456     |  |   842ms         |       |
|  |   +12% vs prev |  |   +8% vs prev|  |   -5% vs prev  |       |
|  +----------------+  +--------------+  +------------------+       |
|                                                                    |
|  +-- Daily Cost Trend (30 days) ----------------------------+     |
|  |  $15 |      *                                             |     |
|  |  $10 |   *     * *    *                                   |     |
|  |   $5 | *   *       * *  * * *    * *                      |     |
|  |   $0 +-------------------------------------------> date   |     |
|  +-----------------------------------------------------------+     |
|                                                                    |
|  +-- Model Breakdown --+  +-- Feature Breakdown -----------+     |
|  |                      |  |                                |     |
|  |  Claude 3.5: 62%    |  |  Task Extract  ||||||||  $85   |     |
|  |  GPT-4o:     28%    |  |  OKR Suggest   |||||     $62   |     |
|  |  Haiku:      10%    |  |  Chat Support  ||||      $53   |     |
|  |                      |  |  Summarize     |||       $32   |     |
|  |  (pie chart)         |  |  Strategy      ||        $15   |     |
|  +----------------------+  +--------------------------------+     |
|                                                                    |
|  +-- Top Users by Cost ----------------------------------------+  |
|  |  #  | User            | Requests | Tokens    | Cost         |  |
|  |  1  | user-a@fdc.com  |    2,340 |   890,234 | $45.23       |  |
|  |  2  | user-b@fdc.com  |    1,892 |   723,456 | $38.12       |  |
|  |  3  | user-c@fdc.com  |    1,456 |   612,345 | $31.45       |  |
|  +-------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

---

## 3. コストアラート設計

### 3.1 アラート条件

| 条件 | レベル | トリガー | アクション |
|------|--------|---------|-----------|
| 日次予算 80% 到達 | Warning | daily_cost >= budget * 0.8 | Slack 通知 |
| 日次予算 100% 到達 | Critical | daily_cost >= budget | Slack 通知 + ソフトリミット発動 |
| 月次予算 80% 到達 | Warning | monthly_cost >= budget * 0.8 | Slack 通知 + メール通知 |
| 月次予算 100% 到達 | Critical | monthly_cost >= budget | Slack 通知 + メール通知 + ハードリミット検討 |

### 3.2 予算設定テーブル

| 設定項目 | 対象 | デフォルト | カスタマイズ |
|---------|------|-----------|------------|
| **全体日次予算** | ワークスペース全体 | $50/日 | Admin が設定可能 |
| **全体月次予算** | ワークスペース全体 | $1,000/月 | Admin が設定可能 |
| **タスク抽出** | 機能単位 | $20/日 | Admin が設定可能 |
| **OKR提案** | 機能単位 | $15/日 | Admin が設定可能 |
| **チャットサポート** | 機能単位 | $10/日 | Admin が設定可能 |
| **ドキュメント要約** | 機能単位 | $5/日 | Admin が設定可能 |

#### 予算設定スキーマ

```sql
CREATE TABLE ai_budget_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  budget_type     TEXT NOT NULL,       -- 'overall', 'feature'
  feature         TEXT,                -- NULL for overall, feature name for per-feature
  daily_budget    DECIMAL(10, 2),      -- USD
  monthly_budget  DECIMAL(10, 2),      -- USD
  alert_enabled   BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(workspace_id, budget_type, feature)
);
```

### 3.3 アラート通知テンプレート (Slack)

#### Warning (80% 到達)

```
:warning: *AI Cost Alert - Warning*
-------------------------------------
Workspace: {{ workspace_name }}
Budget Type: {{ budget_type }}
Period: {{ period }}

Current Spend: ${{ current_cost }}
Budget Limit:  ${{ budget_limit }}
Usage:         {{ percentage }}%

Top Contributors:
  1. {{ feature_1 }}: ${{ cost_1 }}
  2. {{ feature_2 }}: ${{ cost_2 }}
  3. {{ feature_3 }}: ${{ cost_3 }}

Action Required: Review AI usage patterns.
Dashboard: {{ dashboard_url }}
```

#### Critical (100% 到達)

```
:rotating_light: *AI Cost Alert - CRITICAL*
=============================================
Workspace: {{ workspace_name }}
Budget Type: {{ budget_type }}
Period: {{ period }}

Current Spend: ${{ current_cost }}
Budget Limit:  ${{ budget_limit }}
Usage:         {{ percentage }}% (OVER BUDGET)

IMPACT: Soft rate limiting has been activated.
Users may experience slower AI responses.

Immediate Actions:
  1. Review usage at {{ dashboard_url }}
  2. Consider increasing budget
  3. Check for unusual usage patterns

Contact: Admin team
```

---

## 4. 利用量制限設計

### 4.1 プラン別制限

| プラン | 日次トークン上限 | 月次トークン上限 | 同時リクエスト | 備考 |
|--------|-----------------|-----------------|---------------|------|
| **Free** | 10,000 | 100,000 | 1 | 基本機能のみ |
| **Starter** | 50,000 | 500,000 | 3 | 全機能利用可 |
| **Team** | 200,000 | 2,000,000 | 10 | 優先キュー |
| **YourSaas** | unlimited | unlimited | unlimited | カスタム対応 |

### 4.2 ソフトリミット vs ハードリミット

| 種類 | 発動条件 | 動作 | ユーザー影響 |
|------|---------|------|------------|
| **ソフトリミット** | 日次上限の 100% | レスポンス遅延（キュー優先度低下） | レスポンスが遅くなる |
| **ハードリミット** | 月次上限の 100% | リクエスト拒否 | AI 機能が利用不可 |

#### リミットチェック実装

```typescript
// lib/server/ai/usage-limiter.ts

interface UsageLimitResult {
  allowed: boolean;
  limitType: 'none' | 'soft' | 'hard';
  remaining: number;
  resetAt: Date;
  message?: string;
}

async function checkUsageLimit(
  workspaceId: string,
  userId: string,
  plan: 'free' | 'starter' | 'team' | 'yoursaas'
): Promise<UsageLimitResult> {
  const limits = PLAN_LIMITS[plan];

  // YourSaas プランは無制限
  if (plan === 'yoursaas') {
    return { allowed: true, limitType: 'none', remaining: Infinity, resetAt: new Date() };
  }

  // 月次チェック（ハードリミット）
  const monthlyUsage = await getMonthlyTokenUsage(workspaceId, userId);
  if (monthlyUsage >= limits.monthlyTokens) {
    return {
      allowed: false,
      limitType: 'hard',
      remaining: 0,
      resetAt: getNextMonthStart(),
      message: '月次のAI利用上限に達しました。プランのアップグレードをご検討ください。',
    };
  }

  // 日次チェック（ソフトリミット）
  const dailyUsage = await getDailyTokenUsage(workspaceId, userId);
  if (dailyUsage >= limits.dailyTokens) {
    return {
      allowed: true,
      limitType: 'soft',
      remaining: limits.monthlyTokens - monthlyUsage,
      resetAt: getTomorrowStart(),
      message: '日次のAI利用上限に達しました。レスポンスが遅くなる場合があります。',
    };
  }

  return {
    allowed: true,
    limitType: 'none',
    remaining: limits.dailyTokens - dailyUsage,
    resetAt: getTomorrowStart(),
  };
}
```

### 4.3 リミット到達時の UX

| 段階 | トリガー | UI表示 |
|------|---------|--------|
| **通常** | 0-79% | 残量をプログレスバーで表示 |
| **警告** | 80-99% | 黄色バナー「残り XX% です」 |
| **ソフトリミット** | 日次 100% | オレンジバナー「日次上限到達。レスポンスが遅くなります」 |
| **ハードリミット** | 月次 100% | モーダル表示「月次上限到達」+ アップグレード CTA |

#### リミット到達モーダル

```
+--------------------------------------------------+
|  AI Usage Limit Reached                          |
+--------------------------------------------------+
|                                                    |
|  今月のAI利用上限に達しました。                    |
|                                                    |
|  現在のプラン: Starter                             |
|  利用量: 500,000 / 500,000 tokens                  |
|                                                    |
|  AI機能を引き続きご利用いただくには、               |
|  プランのアップグレードをお勧めします。             |
|                                                    |
|  +------------------+  +-------------------+       |
|  | 閉じる           |  | アップグレード     |       |
|  +------------------+  +-------------------+       |
|                                                    |
|  次回リセット: 2026年4月1日                         |
+--------------------------------------------------+
```

---

## 5. モデル価格テーブル

### 5.1 現行価格 (2026-03 時点)

| プロバイダー | モデル | 入力 ($/1M tokens) | 出力 ($/1M tokens) | 備考 |
|-------------|--------|-------------------|-------------------|------|
| **Anthropic** | Claude 3.5 Sonnet | $3.00 | $15.00 | メイン利用 |
| **Anthropic** | Claude 3.5 Haiku | $0.25 | $1.25 | 軽量タスク |
| **OpenAI** | GPT-4o | $2.50 | $10.00 | フォールバック |
| **OpenAI** | GPT-4o mini | $0.15 | $0.60 | 軽量フォールバック |
| **Groq** | Llama 3.1 70B | $0.59 | $0.79 | 低コスト代替 |
| **Groq** | Llama 3.1 8B | $0.05 | $0.08 | 最低コスト |

### 5.2 コスト試算

```
月間想定利用量（Starter プラン、1ユーザー）:

  タスク抽出:     100回 x 平均 1,500 tokens = 150,000 tokens
  OKR提案:        20回 x 平均 2,000 tokens =  40,000 tokens
  チャット:       200回 x 平均 1,000 tokens = 200,000 tokens
  ドキュメント要約: 50回 x 平均 2,000 tokens = 100,000 tokens
  ---------------------------------------------------
  合計:                                       490,000 tokens

  Claude 3.5 Sonnet 利用時:
    入力 (60%): 294,000 tokens x $3.00/1M  = $0.88
    出力 (40%): 196,000 tokens x $15.00/1M = $2.94
    合計: $3.82/月/ユーザー
```

---

## 6. 価格更新ルール

### 6.1 更新トリガー

| トリガー | 対応 | 担当 |
|---------|------|------|
| プロバイダー価格改定 | 価格テーブル更新 + コスト再計算 | DevOps |
| 新モデルリリース | 評価 + 価格テーブル追加 | AI Team |
| 四半期レビュー | コスト分析 + 最適化提案 | Product Team |

### 6.2 価格テーブル管理

```typescript
// lib/config/ai-pricing.ts

export const AI_MODEL_PRICING = {
  'claude-3-5-sonnet': {
    provider: 'anthropic',
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    updatedAt: '2026-03-01',
  },
  'claude-3-5-haiku': {
    provider: 'anthropic',
    inputPerMillion: 0.25,
    outputPerMillion: 1.25,
    updatedAt: '2026-03-01',
  },
  'gpt-4o': {
    provider: 'openai',
    inputPerMillion: 2.5,
    outputPerMillion: 10.0,
    updatedAt: '2026-03-01',
  },
  'gpt-4o-mini': {
    provider: 'openai',
    inputPerMillion: 0.15,
    outputPerMillion: 0.60,
    updatedAt: '2026-03-01',
  },
  'llama-3.1-70b': {
    provider: 'groq',
    inputPerMillion: 0.59,
    outputPerMillion: 0.79,
    updatedAt: '2026-03-01',
  },
} as const;

export function calculateCost(
  model: keyof typeof AI_MODEL_PRICING,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = AI_MODEL_PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}
```

---

## 7. 実装チェックリスト

### Phase 65 完了条件

- [ ] AI Monitoring & Cost Management ドキュメント作成（本ファイル）
- [ ] Usage Tracking スキーマ設計完了
  - [ ] ai_usage_logs テーブル定義
  - [ ] ai_usage_daily テーブル定義
  - [ ] ai_usage_monthly テーブル定義
  - [ ] 集計バッチ関数定義
- [ ] コストダッシュボード設計完了
  - [ ] 表示項目定義
  - [ ] レイアウト設計
- [ ] コストアラート設計完了
  - [ ] アラート条件定義
  - [ ] 予算設定テーブル定義
  - [ ] Slack 通知テンプレート作成
- [ ] 利用量制限設計完了
  - [ ] プラン別制限定義
  - [ ] ソフト/ハードリミット設計
  - [ ] リミット到達 UX 設計
- [ ] モデル価格テーブル策定
- [ ] 価格更新ルール策定
- [ ] FDC-CORE.md 更新

### 技術スタック依存関係

```
必要パッケージ:
  - @supabase/supabase-js   # DB 操作（既存）
  - recharts                 # ダッシュボードグラフ
  - @slack/webhook           # Slack 通知

DB 要件:
  - PostgreSQL 15+           # GENERATED ALWAYS AS, PERCENTILE_CONT
  - pg_cron 拡張             # 日次/月次集計バッチ
```

### 次フェーズへの引き継ぎ事項

- Phase 66: AI Quality Management（品質評価 + プロンプト管理 + A/Bテスト + フィードバックループ）

---

**Last Updated**: 2026-03-05
**Phase**: 65
**Status**: AI Monitoring & Cost Management 設計完了
