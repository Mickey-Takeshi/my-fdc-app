# Phase 67: AI Incident Response

> FDC Modular Starter - AI Ops: Fallback Strategy, Failure Detection, Incident Response & Capacity Planning

---

## 1. フォールバック戦略

### 1.1 5段階フォールバック階層

```
+--------+     +----------+     +-----------+     +----------+     +----------+
| L1     |---->| L2       |---->| L3        |---->| L4       |---->| L5       |
| Retry  |     | Alt Model|     | Alt       |     | Cache    |     | Feature  |
|        |     |          |     | Provider  |     | Response |     | Disable  |
+--------+     +----------+     +-----------+     +----------+     +----------+
  失敗時         失敗時           失敗時            失敗時           最終手段
```

| レベル | 戦略 | 説明 | 所要時間 |
|--------|------|------|---------|
| **L1: リトライ** | 同一モデルで再試行 | 一時的なエラーへの対応 | 1-30秒 |
| **L2: 代替モデル** | 同一プロバイダーの別モデル | Sonnet -> Haiku 等 | 即時 |
| **L3: 代替プロバイダー** | 別プロバイダーに切替 | Anthropic -> OpenAI 等 | 即時 |
| **L4: キャッシュレスポンス** | 過去の類似レスポンスを返却 | 品質は劣る可能性あり | 即時 |
| **L5: 機能無効化** | AI 機能を一時停止 | ユーザーに手動操作を案内 | 即時 |

### 1.2 プロバイダー優先順位

| 優先度 | プロバイダー | モデル | 用途 | SLA |
|--------|-------------|--------|------|-----|
| **1 (Primary)** | Anthropic | Claude 3.5 Sonnet | メイン利用 | 99.9% |
| **2 (Secondary)** | OpenAI | GPT-4o | フォールバック | 99.9% |
| **3 (Tertiary)** | Groq | Llama 3.1 70B | 低コスト代替 | 99.5% |

#### フォールバック実装

```typescript
// lib/server/ai/fallback-handler.ts

interface FallbackConfig {
  providers: ProviderConfig[];
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
  cacheEnabled: boolean;
}

const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  providers: [
    { name: 'anthropic', model: 'claude-3-5-sonnet', priority: 1 },
    { name: 'anthropic', model: 'claude-3-5-haiku', priority: 2 },
    { name: 'openai', model: 'gpt-4o', priority: 3 },
    { name: 'groq', model: 'llama-3.1-70b', priority: 4 },
  ],
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 30000,
  cacheEnabled: true,
};

async function executeWithFallback(
  request: AIRequest,
  config: FallbackConfig = DEFAULT_FALLBACK_CONFIG
): Promise<AIResponse> {
  let lastError: Error | null = null;

  // L1-L3: プロバイダー順にリトライ
  for (const provider of config.providers) {
    try {
      return await executeWithRetry(request, provider, config);
    } catch (error) {
      lastError = error as Error;
      logProviderFailure(provider, error);
      continue;
    }
  }

  // L4: キャッシュフォールバック
  if (config.cacheEnabled) {
    const cachedResponse = await getCachedResponse(request);
    if (cachedResponse) {
      logCacheFallback(request);
      return { ...cachedResponse, fromCache: true, degraded: true };
    }
  }

  // L5: 機能無効化
  logFeatureDisabled(request.feature);
  throw new AIServiceUnavailableError(
    'AI サービスが一時的に利用できません。手動で操作してください。',
    lastError
  );
}
```

### 1.3 リトライ設計

| パラメータ | 値 | 説明 |
|-----------|------|------|
| **最大リトライ回数** | 3 | 3回まで再試行 |
| **初回待機時間** | 1,000ms | 1秒 |
| **バックオフ係数** | 2 | 指数バックオフ |
| **最大待機時間** | 30,000ms | 30秒上限 |
| **ジッター** | 0-500ms | ランダム遅延追加 |

#### リトライタイムライン

```
  リクエスト   1回目失敗   2回目失敗   3回目失敗   フォールバック
     |            |            |            |            |
     +--- 1s ----+--- 2s ----+--- 4s ----+            |
     |   (+jitter)  (+jitter)  (+jitter)               |
     |                                                  |
     +--- 合計最大 7s + jitter ----> 次のプロバイダーへ
```

```typescript
// lib/server/ai/retry.ts

async function executeWithRetry(
  request: AIRequest,
  provider: ProviderConfig,
  config: FallbackConfig
): Promise<AIResponse> {
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await callProvider(request, provider);
    } catch (error) {
      if (attempt === config.maxRetries) throw error;

      // リトライ可能なエラーかチェック
      if (!isRetryableError(error)) throw error;

      // 指数バックオフ + ジッター
      const jitter = Math.random() * 500;
      await sleep(Math.min(delay + jitter, config.maxDelayMs));
      delay *= config.backoffFactor;
    }
  }

  throw new Error('Max retries exceeded');
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    // 429 (Rate Limit), 500, 502, 503, 504 はリトライ可能
    return [429, 500, 502, 503, 504].includes(error.status);
  }
  // ネットワークエラーはリトライ可能
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  return false;
}
```

### 1.4 キャッシュフォールバック

| モード | マッチング | TTL | Stale 許容 | 使用条件 |
|--------|-----------|-----|-----------|---------|
| **通常モード** | 完全一致 | 1時間 | 不可 | 通常運用時 |
| **インシデントモード** | 類似クエリ | 24時間 | 許容 | 全プロバイダー障害時 |

```typescript
// lib/server/ai/cache-fallback.ts

interface CacheConfig {
  mode: 'normal' | 'incident';
  ttlSeconds: number;
  allowStale: boolean;
  similarityThreshold: number;
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  normal: {
    mode: 'normal',
    ttlSeconds: 3600,       // 1時間
    allowStale: false,
    similarityThreshold: 1.0,  // 完全一致
  },
  incident: {
    mode: 'incident',
    ttlSeconds: 86400,      // 24時間
    allowStale: true,
    similarityThreshold: 0.85, // 類似クエリ許容
  },
};

async function getCachedResponse(
  request: AIRequest,
  mode: 'normal' | 'incident' = 'normal'
): Promise<AIResponse | null> {
  const config = CACHE_CONFIGS[mode];
  const cacheKey = generateCacheKey(request);

  // 完全一致チェック
  const exactMatch = await getCacheByKey(cacheKey, config.ttlSeconds, config.allowStale);
  if (exactMatch) return exactMatch;

  // インシデントモード: 類似クエリチェック
  if (mode === 'incident') {
    const similarMatch = await getSimilarCache(
      request,
      config.similarityThreshold,
      config.ttlSeconds
    );
    if (similarMatch) return similarMatch;
  }

  return null;
}
```

---

## 2. 障害検知

### 2.1 監視項目

| 監視項目 | Warning 閾値 | Critical 閾値 | 確認間隔 | アクション |
|---------|-------------|--------------|---------|-----------|
| **エラー率** | > 5% | > 10% | 1分 | アラート + 自動フォールバック |
| **レイテンシ (P95)** | > 10秒 | > 30秒 | 1分 | アラート |
| **レイテンシ (P99)** | > 20秒 | > 60秒 | 1分 | アラート |
| **タイムアウト率** | > 3% | > 8% | 1分 | アラート + リトライ設定調整 |
| **429 Rate Limit** | > 5回/分 | > 20回/分 | 1分 | バックオフ強化 |

### 2.2 ヘルスチェック設計

| チェック種別 | 対象 | 間隔 | タイムアウト | 方法 |
|------------|------|------|------------|------|
| **プロバイダー Ping** | 各 AI プロバイダー | 1分 | 5秒 | API エンドポイントへの軽量リクエスト |
| **エンドポイントチェック** | /api/ai/* | 5分 | 10秒 | テストプロンプトの送信 |
| **品質チェック** | 全機能 | 1時間 | 60秒 | 既知の入力で品質スコアを検証 |

#### ヘルスチェック実装

```typescript
// lib/server/ai/health-check.ts

interface HealthCheckResult {
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  checkedAt: Date;
  error?: string;
}

async function checkProviderHealth(provider: string): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // 軽量なテストリクエスト
    const response = await callProvider({
      prompt: 'Hello',
      maxTokens: 5,
    }, getProviderConfig(provider));

    const latencyMs = Date.now() - startTime;

    return {
      provider,
      status: latencyMs > 10000 ? 'degraded' : 'healthy',
      latencyMs,
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      provider,
      status: 'down',
      latencyMs: Date.now() - startTime,
      checkedAt: new Date(),
      error: (error as Error).message,
    };
  }
}

// 全プロバイダーのヘルスステータス
async function getSystemHealth(): Promise<{
  overall: 'healthy' | 'degraded' | 'down';
  providers: HealthCheckResult[];
}> {
  const results = await Promise.all(
    ['anthropic', 'openai', 'groq'].map(checkProviderHealth)
  );

  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const overall = healthyCount === 0
    ? 'down'
    : healthyCount < results.length
      ? 'degraded'
      : 'healthy';

  return { overall, providers: results };
}
```

### 2.3 異常検知ルール

| 異常パターン | 検知条件 | 対応 |
|-------------|---------|------|
| **突発的エラー急増** | 1分間のエラー率が前5分平均の3倍以上 | 即時アラート + L2フォールバック発動 |
| **段階的品質低下** | 品質スコアが3日連続で前週比5%以上低下 | Warning アラート + プロンプトレビュー |
| **レイテンシ悪化** | P95 レイテンシが1時間継続で10秒超 | Warning アラート + キャパシティ確認 |
| **コスト異常** | 日次コストが予算の50%を4時間以内に消費 | コストアラート + 利用パターン調査 |

```typescript
// lib/server/ai/anomaly-detector.ts

interface AnomalyRule {
  name: string;
  check: (current: MetricSnapshot, baseline: MetricSnapshot) => boolean;
  severity: 'warning' | 'critical';
  action: string;
}

const ANOMALY_RULES: AnomalyRule[] = [
  {
    name: 'sudden_error_spike',
    check: (current, baseline) =>
      current.errorRate > baseline.errorRate * 3 && current.errorRate > 0.05,
    severity: 'critical',
    action: 'activate_fallback_l2',
  },
  {
    name: 'gradual_quality_decline',
    check: (current, baseline) =>
      current.qualityScore < baseline.qualityScore * 0.95,
    severity: 'warning',
    action: 'schedule_prompt_review',
  },
  {
    name: 'latency_degradation',
    check: (current, baseline) =>
      current.p95Latency > 10000 && current.p95Latency > baseline.p95Latency * 2,
    severity: 'warning',
    action: 'check_capacity',
  },
  {
    name: 'cost_anomaly',
    check: (current, _baseline) =>
      current.dailyCostRatio > 0.5 && current.hoursElapsed < 4,
    severity: 'warning',
    action: 'investigate_usage_pattern',
  },
];
```

---

## 3. インシデント対応

### 3.1 重大度定義

| 重大度 | 影響範囲 | 応答時間 | 解決目標 | 例 |
|--------|---------|---------|---------|-----|
| **Critical** | 全ユーザーの AI 機能停止 | 5分以内 | 30分以内 | 全プロバイダーダウン |
| **High** | 一部機能の AI 停止 | 15分以内 | 1時間以内 | メインプロバイダーダウン |
| **Medium** | パフォーマンス劣化 | 1時間以内 | 4時間以内 | レイテンシ大幅増加 |
| **Low** | 軽微な品質低下 | 4時間以内 | 24時間以内 | 特定機能の品質低下 |

### 3.2 対応フロー

```
+----------+    +-----------+    +------------+    +---------+    +----------+
| Detect   |--->| Initial   |--->| Investigate|--->| Remedy  |--->| Recovery |
| (検知)    |    | Response  |    | (調査)      |    | (対処)   |    | (復旧)   |
|          |    | (初動)     |    |            |    |         |    |          |
| 自動検知  |    | 5分以内    |    | 15分以内    |    | 状況次第 |    | 確認     |
+----------+    +-----------+    +------------+    +---------+    +----------+
                                                                       |
                                                                       v
                                                        +----------+    +------------+
                                                        | Report   |--->| Postmortem |
                                                        | (報告)    |    | (振り返り)  |
                                                        +----------+    +------------+
```

### 3.3 対応ランブック

#### Phase 1: 検知 (Detect)

```
チェックリスト:
  [ ] アラートの内容を確認
  [ ] 影響範囲を特定（全体 / 特定プロバイダー / 特定機能）
  [ ] 重大度を判定（Critical / High / Medium / Low）
  [ ] インシデントチケットを作成
  [ ] タイムスタンプを記録
```

#### Phase 2: 初動 (Initial Response) - 5分以内

```
チェックリスト:
  [ ] インシデントコマンダーをアサイン
  [ ] 自動フォールバックが正常に動作しているか確認
  [ ] 影響を受けるユーザー数を確認
  [ ] 内部 Slack チャンネルに通知
  [ ] ステータスページの更新（Critical/High の場合）

Critical の場合の追加アクション:
  [ ] オンコール担当者を招集
  [ ] キャッシュフォールバック（L4）を有効化
  [ ] 30分以上継続の見込みなら顧客通知を準備
```

#### Phase 3: 調査 (Investigate) - 15分以内

```
チェックリスト:
  [ ] プロバイダーのステータスページを確認
    - Anthropic: https://status.anthropic.com
    - OpenAI: https://status.openai.com
    - Groq: https://status.groq.com
  [ ] エラーログを分析
  [ ] 直近のデプロイ/設定変更を確認
  [ ] API キー/クォータの状態を確認
  [ ] ネットワーク接続を確認
  [ ] 根本原因の仮説を立てる
```

#### Phase 4: 対処 (Remedy)

```
チェックリスト:
  [ ] 根本原因に応じた対処を実施:
    - プロバイダー障害: フォールバック継続、復旧待ち
    - API キー問題: キーのローテーション
    - レート制限: リクエスト制限の調整
    - コード起因: ホットフィックスのデプロイ
    - 設定ミス: 設定のロールバック
  [ ] 対処の効果を確認
  [ ] メトリクスが正常範囲に戻ったか監視
```

#### Phase 5: 復旧 (Recovery)

```
チェックリスト:
  [ ] 全メトリクスが正常範囲に復帰したことを確認
    - エラー率 < 1%
    - P95 レイテンシ < 5秒
    - 品質スコア > 4.0
  [ ] フォールバックモードを解除
  [ ] キャッシュモードを通常に戻す
  [ ] ステータスページを更新（復旧済み）
  [ ] 15分間の安定稼働を確認
```

#### Phase 6: 報告 (Report)

```
チェックリスト:
  [ ] インシデントタイムラインを整理
  [ ] 影響サマリーを作成（影響時間、影響ユーザー数、影響機能）
  [ ] 内部報告をSlackに投稿
  [ ] 顧客向け報告を作成（30分以上の障害の場合）
  [ ] インシデントチケットをクローズ
```

#### Phase 7: ポストモーテム (Postmortem)

```
チェックリスト:
  [ ] 48時間以内にポストモーテムミーティングを開催
  [ ] 根本原因分析（5 Whys）を実施
  [ ] 再発防止策を策定
  [ ] アクションアイテムを作成し担当者をアサイン
  [ ] ポストモーテムドキュメントを作成・共有
```

### 3.4 コミュニケーションテンプレート

#### 内部 Slack 通知

```
:rotating_light: *AI Incident - {{ severity }}*
=========================================
Time: {{ timestamp }}
Incident ID: {{ incident_id }}
Commander: {{ commander_name }}

Impact:
  - Affected: {{ affected_description }}
  - Users impacted: {{ user_count }}
  - Duration: {{ duration }}

Status: {{ status }}
Current Action: {{ current_action }}

Provider Status:
  - Anthropic: {{ anthropic_status }}
  - OpenAI: {{ openai_status }}
  - Groq: {{ groq_status }}

Fallback: {{ fallback_level }}
Thread: {{ thread_link }}
```

#### 顧客通知 (30分以上の障害時)

```
件名: [FDC] AI 機能に関するお知らせ

FDC をご利用いただきありがとうございます。

現在、AI 機能において一部サービスの遅延が発生しております。

発生日時: {{ start_time }}
影響範囲: {{ affected_features }}
現在の状況: {{ current_status }}

復旧作業を進めており、状況が改善され次第
改めてご報告いたします。

ご不便をおかけし申し訳ございません。

---
FDC サポートチーム
```

#### 復旧通知

```
件名: [FDC] AI 機能復旧のお知らせ

FDC をご利用いただきありがとうございます。

先ほどご案内いたしました AI 機能の遅延について、
復旧が完了いたしましたのでお知らせいたします。

発生日時: {{ start_time }}
復旧日時: {{ end_time }}
影響時間: {{ duration }}
影響範囲: {{ affected_features }}
原因: {{ root_cause_summary }}

再発防止に向けて対策を実施してまいります。
ご不便をおかけし申し訳ございませんでした。

---
FDC サポートチーム
```

---

## 4. キャパシティプランニング

### 4.1 現行キャパシティ

| リソース | 現在の容量 | 現在の利用率 | 上限 |
|---------|-----------|------------|------|
| **Anthropic API** | 4,000 RPM | 15% | Rate Limit 依存 |
| **OpenAI API** | 3,500 RPM | 5% (フォールバック) | Rate Limit 依存 |
| **Groq API** | 6,000 RPM | 2% (フォールバック) | Rate Limit 依存 |
| **Supabase DB** | 500 接続 | 20% | Pro プラン依存 |
| **Vercel Functions** | 1,000 同時実行 | 10% | Pro プラン依存 |
| **キャッシュ (Redis)** | 256MB | 30% | プラン依存 |

### 4.2 スケーリングトリガー

| トリガー | 閾値 | アクション |
|---------|------|-----------|
| **API 利用率** | > 60% | API プランのアップグレードを検討 |
| **API 利用率** | > 80% | 即時アップグレード実施 |
| **DB 接続数** | > 70% | コネクションプーリングの最適化 |
| **DB 接続数** | > 90% | DB プランのアップグレード |
| **レスポンスキュー** | > 100 件待機 | ワーカー数の増加 |
| **キャッシュ使用率** | > 80% | TTL の短縮 or メモリ増加 |

### 4.3 バーストトラフィック対策

#### 4.3.1 レート制限

```typescript
// lib/server/ai/rate-limiter.ts

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: Request) => string;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    windowMs: 60 * 1000,      // 1分
    maxRequests: 5,             // 5回/分
    keyGenerator: (req) => getUserId(req),
  },
  starter: {
    windowMs: 60 * 1000,
    maxRequests: 20,            // 20回/分
    keyGenerator: (req) => getUserId(req),
  },
  team: {
    windowMs: 60 * 1000,
    maxRequests: 60,            // 60回/分
    keyGenerator: (req) => getWorkspaceId(req),
  },
  yoursaas: {
    windowMs: 60 * 1000,
    maxRequests: 200,           // 200回/分
    keyGenerator: (req) => getWorkspaceId(req),
  },
};
```

#### 4.3.2 キューイング

```typescript
// lib/server/ai/request-queue.ts

interface QueueConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  timeoutMs: number;
  priorityLevels: number;
}

const QUEUE_CONFIG: QueueConfig = {
  maxConcurrent: 50,
  maxQueueSize: 500,
  timeoutMs: 60000,
  priorityLevels: 3,   // 0: high, 1: normal, 2: low
};

// プラン別優先度
const PLAN_PRIORITY: Record<string, number> = {
  yoursaas: 0,  // 最高優先
  team: 0,      // 最高優先
  starter: 1,   // 通常
  free: 2,      // 低優先
};
```

#### 4.3.3 優先度制御

```
+------------------------------------------------------------------+
|  Request Queue                                                     |
+------------------------------------------------------------------+
|                                                                    |
|  Priority 0 (High):  [Team/YourSaas]                              |
|  +-+-+-+-+-+                                                       |
|  |R|R|R|R|R|  --> Processor (即時処理)                              |
|  +-+-+-+-+-+                                                       |
|                                                                    |
|  Priority 1 (Normal): [Starter]                                   |
|  +-+-+-+-+-+-+-+-+                                                 |
|  |R|R|R|R|R|R|R|R|  --> Processor (通常処理)                       |
|  +-+-+-+-+-+-+-+-+                                                 |
|                                                                    |
|  Priority 2 (Low): [Free]                                         |
|  +-+-+-+-+-+-+-+-+-+-+-+                                           |
|  |R|R|R|R|R|R|R|R|R|R|R|  --> Processor (空き時間に処理)           |
|  +-+-+-+-+-+-+-+-+-+-+-+                                           |
|                                                                    |
+------------------------------------------------------------------+
|  Max Concurrent: 50  |  Queue Size: 500  |  Timeout: 60s          |
+------------------------------------------------------------------+
```

---

## 5. 実装チェックリスト

### Phase 67 完了条件

- [ ] AI Incident Response ドキュメント作成（本ファイル）
- [ ] フォールバック戦略設計完了
  - [ ] 5段階フォールバック階層定義
  - [ ] プロバイダー優先順位設定
  - [ ] リトライ設計（指数バックオフ + ジッター）
  - [ ] キャッシュフォールバック設計（通常/インシデントモード）
- [ ] 障害検知設計完了
  - [ ] 監視項目・閾値定義
  - [ ] ヘルスチェック設計
  - [ ] 異常検知ルール策定
- [ ] インシデント対応設計完了
  - [ ] 重大度定義
  - [ ] 対応フロー策定
  - [ ] 各フェーズのランブック・チェックリスト作成
  - [ ] コミュニケーションテンプレート作成
- [ ] キャパシティプランニング完了
  - [ ] 現行キャパシティ表策定
  - [ ] スケーリングトリガー定義
  - [ ] バーストトラフィック対策設計
- [ ] FDC-CORE.md 更新

### 技術スタック依存関係

```
必要パッケージ:
  - ai                      # Vercel AI SDK（既存）
  - @ai-sdk/anthropic       # Anthropic プロバイダー（既存）
  - @ai-sdk/openai          # OpenAI プロバイダー（既存）
  - @slack/webhook           # Slack 通知（Phase 65 と共通）
  - ioredis                  # Redis キャッシュ/キューイング

インフラ要件:
  - Redis                   # キャッシュ + レート制限 + キュー
  - Vercel Cron             # ヘルスチェック定期実行
```

### 次フェーズへの引き継ぎ事項

- Phase 68 以降: AI Ops の実装フェーズ（監視ダッシュボード実装、フォールバック実装、アラート連携実装）

---

**Last Updated**: 2026-03-05
**Phase**: 67
**Status**: AI Incident Response 設計完了
