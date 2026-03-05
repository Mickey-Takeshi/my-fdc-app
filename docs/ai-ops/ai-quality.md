# Phase 66: AI Quality Management

> FDC Modular Starter - AI Ops: Quality Evaluation, Prompt Versioning, A/B Testing & Feedback Loop

---

## 1. 品質評価設計

### 1.1 評価手法

| 手法 | 説明 | 頻度 | コスト | 精度 |
|------|------|------|--------|------|
| **ユーザーフィードバック** | Thumbs up/down + コメント | リアルタイム | 低 | 中 |
| **LLM as Judge** | 別の LLM による自動評価 | 全リクエスト | 中 | 中-高 |
| **人間レビュー** | 専門家による手動評価 | サンプリング | 高 | 高 |

### 1.2 品質メトリクス

| メトリクス | 目標値 | 測定方法 | 頻度 |
|-----------|--------|---------|------|
| **有用性スコア** | > 80% | ユーザーフィードバック (thumbs up 率) | リアルタイム |
| **品質スコア** | > 4.0 / 5.0 | LLM as Judge 平均スコア | 日次 |
| **問題報告率** | < 1% | 問題報告数 / 全リクエスト数 | 週次 |
| **正確性スコア** | > 90% | 人間レビュー | 月次サンプリング |
| **レスポンス一貫性** | > 85% | 同一入力での出力比較 | 週次 |

### 1.3 ユーザーフィードバック UI

#### フィードバックコンポーネント

```
+------------------------------------------------------+
|  AI Response                                          |
|                                                        |
|  [AI が生成したコンテンツ]                              |
|                                                        |
|  +--------------------------------------------------+ |
|  | このレスポンスは役に立ちましたか?                    | |
|  |                                                    | |
|  |  [ (thumbs-up) 役立った ]  [ (thumbs-down) 改善が必要 ]  | |
|  +--------------------------------------------------+ |
+------------------------------------------------------+
```

#### Thumbs Down 時の詳細フィードバック

```
+------------------------------------------------------+
|  改善にご協力ください                                  |
|                                                        |
|  問題の種類:                                           |
|  ( ) 不正確な情報が含まれている                         |
|  ( ) 質問に対する回答になっていない                     |
|  ( ) 内容が不完全                                      |
|  ( ) 不適切な表現が含まれている                         |
|  ( ) その他                                            |
|                                                        |
|  コメント (任意):                                       |
|  +--------------------------------------------------+ |
|  |                                                    | |
|  +--------------------------------------------------+ |
|                                                        |
|  [ キャンセル ]                    [ 送信 ]             |
+------------------------------------------------------+
```

#### フィードバックデータスキーマ

```sql
CREATE TABLE ai_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_log_id    UUID NOT NULL REFERENCES ai_usage_logs(id) ON DELETE CASCADE,
  rating          TEXT NOT NULL,           -- 'positive', 'negative'
  problem_type    TEXT,                    -- 'inaccurate', 'irrelevant', 'incomplete', 'inappropriate', 'other'
  comment         TEXT,
  feature         TEXT NOT NULL,
  model           TEXT NOT NULL,
  prompt_version  TEXT,                    -- 使用されたプロンプトバージョン
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_feedback_workspace ON ai_feedback(workspace_id, created_at DESC);
CREATE INDEX idx_ai_feedback_feature ON ai_feedback(feature, rating, created_at DESC);
```

### 1.4 LLM as Judge 設計

#### 評価基準

| 基準 | 重み | 説明 | スコアリング |
|------|------|------|------------|
| **正確性 (Accuracy)** | 30% | 事実に基づいた正確な情報か | 1-5 |
| **関連性 (Relevance)** | 25% | ユーザーの質問/要求に対して的確か | 1-5 |
| **明瞭性 (Clarity)** | 20% | 読みやすく理解しやすい文章か | 1-5 |
| **完全性 (Completeness)** | 15% | 必要な情報が網羅されているか | 1-5 |
| **安全性 (Safety)** | 10% | 不適切な内容が含まれていないか | 1-5 |

#### LLM as Judge プロンプト

```typescript
// lib/server/ai/quality-judge.ts

const JUDGE_SYSTEM_PROMPT = `あなたはAIレスポンスの品質評価者です。
以下の基準でスコアを付けてください（各1-5点）:

1. 正確性 (Accuracy): 事実に基づいた正確な情報か
2. 関連性 (Relevance): ユーザーの要求に対して的確か
3. 明瞭性 (Clarity): 読みやすく理解しやすいか
4. 完全性 (Completeness): 必要な情報が網羅されているか
5. 安全性 (Safety): 不適切な内容が含まれていないか

JSON形式で回答してください。`;

const JUDGE_USER_TEMPLATE = `
ユーザー入力: {{ user_input }}
AIレスポンス: {{ ai_response }}
機能コンテキスト: {{ feature_context }}
`;

interface JudgeResult {
  accuracy: number;
  relevance: number;
  clarity: number;
  completeness: number;
  safety: number;
  overallScore: number;
  reasoning: string;
}

async function evaluateResponse(
  userInput: string,
  aiResponse: string,
  featureContext: string
): Promise<JudgeResult> {
  const result = await generateObject({
    model: anthropic('claude-3-5-haiku-20241022'),
    schema: judgeResultSchema,
    system: JUDGE_SYSTEM_PROMPT,
    prompt: JUDGE_USER_TEMPLATE
      .replace('{{ user_input }}', userInput)
      .replace('{{ ai_response }}', aiResponse)
      .replace('{{ feature_context }}', featureContext),
  });

  const scores = result.object;
  scores.overallScore =
    scores.accuracy * 0.30 +
    scores.relevance * 0.25 +
    scores.clarity * 0.20 +
    scores.completeness * 0.15 +
    scores.safety * 0.10;

  return scores;
}
```

---

## 2. プロンプトバージョン管理

### 2.1 バージョニングルール

| 変更種別 | バージョン | 説明 | 例 |
|---------|-----------|------|-----|
| **Major** | X.0.0 | プロンプトの大幅な構造変更 | 出力形式の変更 |
| **Minor** | x.Y.0 | 機能追加・改善 | 新しい制約の追加 |
| **Patch** | x.y.Z | 微修正・誤字修正 | typo 修正 |

### 2.2 プロンプトレジストリ

```typescript
// lib/server/ai/prompt-registry.ts

interface PromptEntry {
  name: string;
  version: string;
  template: string;
  systemPrompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  changelog: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'testing' | 'active' | 'deprecated';
}

const PROMPT_REGISTRY: Record<string, PromptEntry> = {
  'task-extract': {
    name: 'task-extract',
    version: '2.1.0',
    template: `以下のテキストからタスクを抽出してください。
各タスクに: タイトル、説明、4象限分類(urgent_important/not_urgent_important/urgent_not_important/not_urgent_not_important)、期限を設定してください。

入力テキスト:
{{ input_text }}`,
    systemPrompt: 'あなたはプロジェクトマネージャーです。テキストからアクションアイテムを抽出する専門家です。',
    model: 'claude-3-5-sonnet',
    maxTokens: 2048,
    temperature: 0.3,
    changelog: 'v2.1.0: 4象限分類の精度向上、期限推定ロジック追加',
    createdAt: '2026-02-15',
    updatedAt: '2026-03-01',
    status: 'active',
  },
  'okr-suggest': {
    name: 'okr-suggest',
    version: '1.3.0',
    template: `以下の事業目標に基づいて、OKR（Objectives and Key Results）を提案してください。

事業目標:
{{ business_goal }}

既存OKR:
{{ existing_okrs }}`,
    systemPrompt: 'あなたはOKR設計の専門家です。SMARTな目標設定を支援します。',
    model: 'claude-3-5-sonnet',
    maxTokens: 2048,
    temperature: 0.5,
    changelog: 'v1.3.0: 既存OKRとの重複チェック追加',
    createdAt: '2026-01-20',
    updatedAt: '2026-02-28',
    status: 'active',
  },
};
```

#### プロンプトレジストリ DB スキーマ

```sql
CREATE TABLE ai_prompt_registry (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  version         TEXT NOT NULL,
  template        TEXT NOT NULL,
  system_prompt   TEXT NOT NULL,
  model           TEXT NOT NULL,
  max_tokens      INTEGER NOT NULL DEFAULT 2048,
  temperature     DECIMAL(3, 2) NOT NULL DEFAULT 0.5,
  changelog       TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',  -- 'draft', 'testing', 'active', 'deprecated'
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(name, version)
);

CREATE INDEX idx_ai_prompt_registry_name ON ai_prompt_registry(name, status);
```

### 2.3 プロンプト変更フロー

```
+----------+     +---------+     +--------+     +----------+     +------------+
| Proposal |---->| A/B Test|---->| Review |---->| Approval |---->| Production |
| (Draft)  |     |(Testing)|     |        |     |          |     | (Active)   |
+----------+     +---------+     +--------+     +----------+     +------------+
                      |                              |
                      |  テスト不合格                  |  却下
                      v                              v
                 +----------+                   +----------+
                 | Revision |                   | Archived |
                 +----------+                   +----------+
```

#### 各ステップの詳細

| ステップ | 担当 | 条件 | 成果物 |
|---------|------|------|--------|
| **Proposal** | 開発者/PM | 改善の必要性が明確 | Draft プロンプト |
| **A/B Test** | AI Team | サンプルサイズ 100+ | テスト結果レポート |
| **Review** | Tech Lead | 品質スコア改善を確認 | レビューコメント |
| **Approval** | Product Owner | ビジネス要件を満たす | 承認記録 |
| **Production** | DevOps | デプロイ完了 | Active バージョン |

### 2.4 ロールバック手順

```
ロールバック判断基準:
  - 品質スコアが前バージョンより 10% 以上低下
  - エラー率が 5% を超過
  - ユーザーからの問題報告が急増

ロールバック手順:
  1. 現行バージョンのステータスを 'deprecated' に変更
  2. 前バージョンのステータスを 'active' に復元
  3. キャッシュをクリア
  4. ロールバック完了通知を送信
  5. インシデントレポートを作成

ロールバック所要時間: 5分以内
```

```typescript
// lib/server/ai/prompt-rollback.ts

async function rollbackPrompt(promptName: string): Promise<void> {
  const supabase = createServiceClient();

  // 1. 現行 Active バージョンを取得
  const { data: current } = await supabase
    .from('ai_prompt_registry')
    .select('*')
    .eq('name', promptName)
    .eq('status', 'active')
    .single();

  if (!current) throw new Error(`Active prompt not found: ${promptName}`);

  // 2. 前バージョンを取得（deprecated の中で最新）
  const { data: previous } = await supabase
    .from('ai_prompt_registry')
    .select('*')
    .eq('name', promptName)
    .eq('status', 'deprecated')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!previous) throw new Error(`No previous version to rollback: ${promptName}`);

  // 3. ステータス更新
  await supabase
    .from('ai_prompt_registry')
    .update({ status: 'deprecated', updated_at: new Date().toISOString() })
    .eq('id', current.id);

  await supabase
    .from('ai_prompt_registry')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', previous.id);

  // 4. キャッシュクリア
  await clearPromptCache(promptName);

  // 5. 通知
  await notifyRollback(promptName, current.version, previous.version);
}
```

---

## 3. AI A/B テスト設計

### 3.1 テスト対象

| 対象 | 説明 | 例 |
|------|------|-----|
| **プロンプト** | プロンプトテンプレートの比較 | v2.0 vs v2.1 |
| **モデル** | 異なるモデルの比較 | Claude 3.5 Sonnet vs GPT-4o |
| **パラメータ** | temperature 等の比較 | temp 0.3 vs 0.5 |
| **システムプロンプト** | 役割設定の比較 | 「専門家」 vs 「アシスタント」 |

### 3.2 テスト設計

| 設計項目 | 推奨値 | 説明 |
|---------|--------|------|
| **最小サンプルサイズ** | 100 リクエスト/バリアント | 統計的有意性の確保 |
| **テスト期間** | 7-14 日間 | 曜日バイアスの排除 |
| **トラフィック配分** | 50/50 | 均等配分（新プロンプトのリスクが低い場合） |
| **トラフィック配分** | 90/10 | 段階的配分（新プロンプトのリスクが高い場合） |
| **除外条件** | 新規ユーザー初回利用 | 学習曲線の影響を排除 |

#### A/B テストスキーマ

```sql
CREATE TABLE ai_ab_tests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  feature         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',  -- 'draft', 'running', 'completed', 'cancelled'
  variant_a       JSONB NOT NULL,         -- { prompt_version, model, temperature, ... }
  variant_b       JSONB NOT NULL,
  traffic_split   DECIMAL(3, 2) NOT NULL DEFAULT 0.50,  -- variant_b の割合
  min_sample_size INTEGER NOT NULL DEFAULT 100,
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  winner          TEXT,                   -- 'A', 'B', 'inconclusive'
  results         JSONB,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.3 評価メトリクス

| メトリクス | 重み | 説明 | 統計手法 |
|-----------|------|------|---------|
| **品質スコア** | 40% | LLM as Judge の平均スコア | t-test |
| **ユーザー満足度** | 30% | thumbs up 率 | chi-squared test |
| **コスト** | 20% | 平均リクエストコスト | t-test |
| **レイテンシ** | 10% | 平均レスポンス時間 | t-test |

#### 勝者判定ロジック

```typescript
// lib/server/ai/ab-test-evaluator.ts

interface ABTestResult {
  winner: 'A' | 'B' | 'inconclusive';
  confidence: number;
  metrics: {
    qualityScore: { a: number; b: number; pValue: number };
    satisfaction: { a: number; b: number; pValue: number };
    cost: { a: number; b: number; pValue: number };
    latency: { a: number; b: number; pValue: number };
  };
  recommendation: string;
}

function evaluateABTest(
  variantAData: VariantData,
  variantBData: VariantData,
  significanceLevel: number = 0.05
): ABTestResult {
  // 各メトリクスの統計検定
  const qualityTest = tTest(variantAData.qualityScores, variantBData.qualityScores);
  const satisfactionTest = chiSquaredTest(variantAData.thumbsUp, variantBData.thumbsUp);
  const costTest = tTest(variantAData.costs, variantBData.costs);
  const latencyTest = tTest(variantAData.latencies, variantBData.latencies);

  // 加重スコア計算
  const scoreA =
    qualityTest.meanA * 0.4 +
    satisfactionTest.rateA * 0.3 +
    (1 - normalize(costTest.meanA)) * 0.2 +
    (1 - normalize(latencyTest.meanA)) * 0.1;

  const scoreB =
    qualityTest.meanB * 0.4 +
    satisfactionTest.rateB * 0.3 +
    (1 - normalize(costTest.meanB)) * 0.2 +
    (1 - normalize(latencyTest.meanB)) * 0.1;

  // 判定
  const allSignificant = [qualityTest, satisfactionTest, costTest, latencyTest]
    .some(t => t.pValue < significanceLevel);

  return {
    winner: !allSignificant ? 'inconclusive' : scoreA > scoreB ? 'A' : 'B',
    confidence: 1 - Math.min(...[qualityTest, satisfactionTest].map(t => t.pValue)),
    metrics: { /* ... */ },
    recommendation: generateRecommendation(scoreA, scoreB, allSignificant),
  };
}
```

---

## 4. フィードバックループ設計

### 4.1 フィードバック収集ソース

| ソース | データ種別 | 収集方法 | 優先度 |
|--------|-----------|---------|--------|
| **Thumbs up/down** | 定量 | UI コンポーネント | P1 |
| **問題報告** | 定性 | フィードバックフォーム | P1 |
| **自由コメント** | 定性 | テキスト入力 | P2 |
| **利用データ** | 定量 | 自動収集 | P1 |
| **リトライ率** | 定量 | 自動収集 | P2 |
| **編集率** | 定量 | AI 出力の後編集を追跡 | P3 |

### 4.2 分析・改善サイクル

```
                    +-------------------+
                    |   データ収集       |
                    | (フィードバック/   |
                    |  利用データ)       |
                    +--------+----------+
                             |
                             v
                    +-------------------+
                    |   分析・分類       |
                    | (自動 + 手動)      |
                    +--------+----------+
                             |
                             v
                    +-------------------+
                    |   課題特定         |
                    | (パターン分析)     |
                    +--------+----------+
                             |
                             v
                    +-------------------+
                    |   改善策立案       |
                    | (プロンプト改善/    |
                    |  モデル変更等)      |
                    +--------+----------+
                             |
                             v
                    +-------------------+
                    |   A/B テスト       |
                    | (効果検証)         |
                    +--------+----------+
                             |
                             v
                    +-------------------+
                    |   本番デプロイ      |
                    | (承認後)           |
                    +--------+----------+
                             |
                             +-----------> (サイクル繰り返し)
```

### 4.3 定期レビュー

| レビュー | 頻度 | 参加者 | 目的 | 成果物 |
|---------|------|--------|------|--------|
| **フィードバック分析** | 週次 | AI Team | 直近のフィードバック傾向を把握 | 週次レポート |
| **改善ミーティング** | 月次 | AI Team + PM | 改善施策の優先順位付け | 改善バックログ |
| **プロンプトレビュー** | 四半期 | AI Team + Tech Lead | 全プロンプトの棚卸し | レビューレポート |
| **品質目標見直し** | 半期 | Product + Engineering | メトリクス目標の再設定 | 更新された目標値 |

### 4.4 改善優先度マトリクス

```
            影響度 高
               |
    +----------+-----------+
    |  Quick   |  Major    |
    |  Win     |  Project  |
    | (P1)     |  (P2)     |
    |          |           |
----+----------+-----------+---- 実装コスト
    |          |           |     高
    |  Fill    |  Nice to  |
    |  In      |  Have     |
    | (P3)     |  (P4)     |
    |          |           |
    +----------+-----------+
               |
            影響度 低
    実装コスト 低
```

| 優先度 | カテゴリ | 条件 | 対応目安 |
|--------|---------|------|---------|
| **P1** | Quick Win | 影響度高 + 実装コスト低 | 1週間以内 |
| **P2** | Major Project | 影響度高 + 実装コスト高 | 1ヶ月以内 |
| **P3** | Fill In | 影響度低 + 実装コスト低 | 次スプリント |
| **P4** | Nice to Have | 影響度低 + 実装コスト高 | バックログ |

---

## 5. 実装チェックリスト

### Phase 66 完了条件

- [ ] AI Quality Management ドキュメント作成（本ファイル）
- [ ] 品質評価設計完了
  - [ ] 評価手法定義（ユーザーフィードバック / LLM as Judge / 人間レビュー）
  - [ ] 品質メトリクス目標値設定
  - [ ] ユーザーフィードバック UI 設計
  - [ ] LLM as Judge 評価基準・プロンプト設計
- [ ] プロンプトバージョン管理設計完了
  - [ ] バージョニングルール策定
  - [ ] プロンプトレジストリ構造定義
  - [ ] 変更フロー策定
  - [ ] ロールバック手順策定
- [ ] AI A/B テスト設計完了
  - [ ] テスト対象定義
  - [ ] テスト設計パラメータ策定
  - [ ] 評価メトリクス・勝者判定ロジック設計
- [ ] フィードバックループ設計完了
  - [ ] 収集ソース定義
  - [ ] 分析・改善サイクル設計
  - [ ] 定期レビュー計画策定
  - [ ] 改善優先度マトリクス策定
- [ ] FDC-CORE.md 更新

### 技術スタック依存関係

```
必要パッケージ:
  - ai                      # Vercel AI SDK（LLM as Judge 用）
  - @ai-sdk/anthropic       # Anthropic プロバイダー（既存）
  - simple-statistics        # 統計検定（t-test, chi-squared）
  - @supabase/supabase-js   # DB 操作（既存）

DB 要件:
  - ai_feedback テーブル
  - ai_prompt_registry テーブル
  - ai_ab_tests テーブル
```

### 次フェーズへの引き継ぎ事項

- Phase 67: AI Incident Response（フォールバック戦略 + 障害検知 + インシデント対応 + キャパシティプランニング）

---

**Last Updated**: 2026-03-05
**Phase**: 66
**Status**: AI Quality Management 設計完了
