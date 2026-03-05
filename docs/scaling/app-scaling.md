# Phase 69: App Scaling Design

> FDC Modular Starter - アプリケーションスケーリング設計

---

## 1. Caching Strategy (キャッシュ戦略)

### 1.1 FDCキャッシュ対象

| データ種別 | TTL | 理由 | 無効化タイミング |
|-----------|-----|------|-----------------|
| **ユーザープロフィール** | 5min | 変更頻度が低い | プロフィール更新時 |
| **ワークスペース設定** | 10min | 設定変更は稀 | 設定変更時 |
| **タスク一覧** | 30sec | リアルタイム性が重要 | タスクCRUD時 |
| **ブランドデータ** | 5min | 変更頻度が低い | ブランド更新時 |
| **リード一覧** | 1min | 営業活動中は更新あり | リードCRUD時 |
| **OKR/ActionMap** | 5min | 参照が中心 | 更新時 |
| **監査ログ** | 30sec | 管理者のみ参照 | ログ追記時 |
| **AI利用量サマリー** | 5min | ダッシュボード表示用 | 利用発生時 |
| **プラン/課金情報** | 10min | 変更頻度が低い | Webhook受信時 |

### 1.2 3層キャッシュ階層

```
+--------------------------------------------------+
|  L1: Memory Cache (LRU)                          |
|  - Vercel Serverless Function 内メモリ            |
|  - TTL: 10-60sec                                 |
|  - 容量: 最大 50MB / Function                     |
|  - 用途: ホットデータ（認証情報、設定）            |
+--------------------------------------------------+
           |  miss
           v
+--------------------------------------------------+
|  L2: Upstash Redis                               |
|  - サーバーレス対応 Redis                          |
|  - TTL: 30sec - 10min                             |
|  - 容量: 256MB（Pro Plan）                        |
|  - 用途: セッション、リスト、集計結果              |
+--------------------------------------------------+
           |  miss
           v
+--------------------------------------------------+
|  L3: Vercel Edge CDN                             |
|  - stale-while-revalidate ヘッダー               |
|  - TTL: ページ種別に依存                          |
|  - 容量: 無制限                                   |
|  - 用途: 静的アセット、ISRページ                   |
+--------------------------------------------------+
           |  miss
           v
+--------------------------------------------------+
|  Origin: Supabase PostgreSQL                     |
+--------------------------------------------------+
```

### 1.3 キャッシュキー設計パターン

```typescript
// キャッシュキーの命名規則
// 形式: {entity}:{scope}:{identifier}:{sub-resource}

// ユーザースコープ
const userProfileKey = `user:${userId}:profile`;
const userSettingsKey = `user:${userId}:settings`;

// ワークスペーススコープ
const wsTasksKey = `ws:${workspaceId}:tasks`;
const wsBrandsKey = `ws:${workspaceId}:brands`;
const wsLeadsKey = `ws:${workspaceId}:leads`;
const wsSettingsKey = `ws:${workspaceId}:settings`;
const wsMembersKey = `ws:${workspaceId}:members`;

// ページネーション付きキー
const wsTasksPageKey = `ws:${workspaceId}:tasks:page:${page}:size:${size}`;

// フィルター付きキー（ハッシュ化）
const filterHash = hashObject({ status, quadrant, dateRange });
const wsTasksFilterKey = `ws:${workspaceId}:tasks:filter:${filterHash}`;

// バージョン付きキー（スキーマ変更時にバージョンを上げる）
const CACHE_VERSION = 'v1';
const versionedKey = `${CACHE_VERSION}:ws:${workspaceId}:tasks`;
```

### 1.4 キャッシュ無効化戦略

| 戦略 | 説明 | 適用場面 |
|------|------|---------|
| **パターン削除** | 前方一致でキーを一括削除 | ワークスペース内の全タスクキャッシュ削除 |
| **即座削除** | 特定キーを即座に削除 | 個別エンティティの更新時 |
| **TTL失効** | 自然に失効するのを待つ | 参照頻度が低いデータ |
| **Write-through** | 書き込み時にキャッシュも更新 | ユーザー設定など |

```typescript
// パターン削除の実装例
async function invalidateWorkspaceCache(
  redis: Redis,
  workspaceId: string,
  entity: string
): Promise<void> {
  const pattern = `ws:${workspaceId}:${entity}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  // メインキーも削除
  await redis.del(`ws:${workspaceId}:${entity}`);
}

// Write-through の実装例
async function updateTaskWithCache(
  supabase: SupabaseClient,
  redis: Redis,
  task: TaskUpdate
): Promise<Task> {
  // 1. DBに書き込み
  const { data } = await supabase
    .from('tasks')
    .update(task)
    .eq('id', task.id)
    .select()
    .single();

  // 2. 関連キャッシュを無効化
  await invalidateWorkspaceCache(redis, data.workspace_id, 'tasks');

  return data;
}
```

---

## 2. CDN Design (CDN設計)

### 2.1 CDN対象とキャッシュ期間

| 対象 | Cache-Control | CDN TTL | 説明 |
|------|--------------|---------|------|
| **静的アセット** (JS/CSS) | `public, max-age=31536000, immutable` | 1年 | ハッシュ付きファイル名で管理 |
| **画像** (PNG/SVG/WebP) | `public, max-age=86400, stale-while-revalidate=604800` | 24h | 更新時はURLを変更 |
| **API レスポンス** | `private, no-cache, stale-while-revalidate=60` | - | SWR で裏側で再検証 |
| **HTML ページ** | `no-cache, no-store, must-revalidate` | - | 常にサーバーから取得 |
| **LP（公開ページ）** | `public, max-age=3600, stale-while-revalidate=86400` | 1h | ISR で再生成 |
| **フォント** | `public, max-age=31536000, immutable` | 1年 | 変更なし |

### 2.2 ページ種別ごとのキャッシュヘッダー設定

```typescript
// next.config.ts のヘッダー設定
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 静的アセット（_next/static/）
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 公開画像
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // API Routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache',
          },
        ],
      },
      {
        // LP ページ
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};
```

---

## 3. Background Job Design (バックグラウンドジョブ設計)

### 3.1 FDCジョブ一覧

| ジョブ | 実行頻度 | 優先度 | 実行方法 | 説明 |
|--------|---------|--------|---------|------|
| **週次レポートメール** | 毎週月曜 9:00 | 中 | Vercel Cron | タスク完了率・KPIサマリー |
| **データエクスポート** | ユーザー要求時 | 中 | Inngest | CSV/JSON一括エクスポート |
| **AIバッチ処理** | 毎日 3:00 | 低 | Vercel Cron | AI利用量集計・コスト計算 |
| **利用量集計** | 毎時 | 高 | Vercel Cron | ai_usage_daily テーブル更新 |
| **招待メール送信** | イベント発生時 | 高 | Inngest | ワークスペース招待通知 |
| **Webhook再送** | リトライ時 | 高 | Inngest | Stripe Webhook失敗時の再送 |
| **古いログ削除** | 毎日 4:00 | 低 | Vercel Cron | 90日以上前の監査ログ削除 |
| **ヘルスチェック** | 毎5分 | 高 | Vercel Cron | DB/外部サービス疎通確認 |

### 3.2 実行方法別設計

#### Vercel Cron（定期実行）

```typescript
// app/api/cron/weekly-report/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Vercel Cron のシークレット検証
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 週次レポート生成ロジック
  const workspaces = await getActiveWorkspaces();

  for (const ws of workspaces) {
    await generateWeeklyReport(ws.id);
  }

  return NextResponse.json({
    success: true,
    processed: workspaces.length,
  });
}
```

```json
// vercel.json - Cron 設定
{
  "crons": [
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/cron/usage-aggregation",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/ai-batch",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/cleanup-logs",
      "schedule": "0 4 * * *"
    },
    {
      "path": "/api/health",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Inngest（イベント駆動）

```typescript
// lib/inngest/functions.ts
import { inngest } from './client';

// データエクスポート（ユーザー要求時）
export const dataExport = inngest.createFunction(
  {
    id: 'data-export',
    retries: 3,
  },
  { event: 'app/data.export.requested' },
  async ({ event, step }) => {
    const { workspaceId, userId, format } = event.data;

    // Step 1: データ収集
    const data = await step.run('collect-data', async () => {
      return await collectWorkspaceData(workspaceId);
    });

    // Step 2: ファイル生成
    const fileUrl = await step.run('generate-file', async () => {
      return await generateExportFile(data, format);
    });

    // Step 3: 通知メール送信
    await step.run('send-notification', async () => {
      await sendExportReadyEmail(userId, fileUrl);
    });

    return { fileUrl };
  }
);

// Webhook 再送（遅延実行）
export const webhookRetry = inngest.createFunction(
  {
    id: 'webhook-retry',
    retries: 5,
    backoff: {
      type: 'exponential',
      delay: '30s',
      maxDelay: '1h',
    },
  },
  { event: 'stripe/webhook.failed' },
  async ({ event, step }) => {
    const { webhookId, payload } = event.data;
    await processStripeWebhook(payload);
  }
);
```

### 3.3 エラーハンドリング

| 戦略 | 設定 | 説明 |
|------|------|------|
| **リトライ（指数バックオフ）** | 初回30s、最大1h、最大5回 | 一時的障害の自動回復 |
| **永続エラー通知** | 5回失敗後にSlack通知 | 人的介入が必要な障害 |
| **Dead Letter Queue** | 最大リトライ超過時に保存 | 後日再処理のためのデータ保全 |
| **タイムアウト** | ジョブ種別に応じて30s-5min | 無限実行の防止 |

```typescript
// エラーハンドリングパターン
async function executeJobWithRetry<T>(
  jobName: string,
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  }
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === options.maxRetries) {
        // 最大リトライ到達: 通知 + DLQ
        await notifyPermanentFailure(jobName, lastError);
        throw lastError;
      }

      // 指数バックオフ
      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt),
        options.maxDelay
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
```

### 3.4 べき等性設計

```typescript
// べき等キーによる重複実行防止
async function processWithIdempotency(
  redis: Redis,
  idempotencyKey: string,
  ttl: number,
  fn: () => Promise<void>
): Promise<{ executed: boolean }> {
  // NX: キーが存在しない場合のみ設定
  const acquired = await redis.set(
    `idempotency:${idempotencyKey}`,
    'processing',
    { nx: true, ex: ttl }
  );

  if (!acquired) {
    // 既に処理済みまたは処理中
    return { executed: false };
  }

  try {
    await fn();
    await redis.set(
      `idempotency:${idempotencyKey}`,
      'completed',
      { ex: ttl }
    );
    return { executed: true };
  } catch (error) {
    // エラー時はキーを削除してリトライ可能にする
    await redis.del(`idempotency:${idempotencyKey}`);
    throw error;
  }
}

// 使用例: 週次レポート
await processWithIdempotency(
  redis,
  `weekly-report:${workspaceId}:${weekNumber}`,
  86400, // 24時間
  async () => {
    await generateWeeklyReport(workspaceId);
  }
);
```

---

## 4. Rate Limiting (レート制限)

### 4.1 エンドポイント別制限

| エンドポイント | 制限 | 単位 | 理由 |
|--------------|------|------|------|
| `/api/*`（汎用） | 100 req/min | IP | 一般的なAPI保護 |
| `/api/auth/login` | 10 req/min | IP | ブルートフォース防止 |
| `/api/auth/callback` | 20 req/min | IP | OAuth コールバック保護 |
| `/api/ai/*` | 20 req/min | User | AIコスト制御 |
| `/api/billing/webhook` | 50 req/min | IP | Stripe Webhook |
| `/api/tasks` (POST) | 30 req/min | User | スパム防止 |
| `/api/admin/*` | 60 req/min | User | 管理API保護 |
| `/api/health` | 300 req/min | IP | ヘルスチェック許容 |

### 4.2 アルゴリズム選定

| アルゴリズム | 特徴 | 推奨度 |
|------------|------|--------|
| **Fixed Window** | 単純だがウィンドウ境界で2倍バーストの可能性 | 非推奨 |
| **Sliding Window** | 正確なレート制御、メモリ効率も良好 | **推奨** |
| **Token Bucket** | バースト許容、複雑な実装 | 特定用途 |
| **Leaky Bucket** | 一定レートの出力、キューイングが必要 | 特定用途 |

#### Sliding Window の実装

```typescript
// lib/server/rate-limit.ts
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// エンドポイント別レートリミッター
export const rateLimiters = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'ratelimit:api',
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'ratelimit:auth',
  }),
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'ratelimit:ai',
  }),
};

// ミドルウェアでの使用
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const result = await limiter.limit(identifier);
  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
```

### 4.3 429レスポンス形式

```typescript
// レート制限超過時のレスポンス
export function rateLimitResponse(result: {
  limit: number;
  remaining: number;
  reset: number;
}): NextResponse {
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please retry after the reset time.',
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': Math.ceil(
          (result.reset - Date.now()) / 1000
        ).toString(),
      },
    }
  );
}
```

---

## 5. Scalability Goals (スケーラビリティ目標)

### 5.1 スケーリングトリガー

| 指標 | 現在の想定 | トリガー閾値 | アクション |
|------|-----------|-------------|-----------|
| **DAU** | ~100 | 1,000 | キャッシュ層導入 |
| **DAU** | 1,000 | 5,000 | リードレプリカ導入 |
| **DAU** | 5,000 | 10,000 | マイクロサービス分離検討 |
| **API RPS** | ~10 | 100 | CDN + Edge最適化 |
| **API RPS** | 100 | 500 | Serverless 並列数拡張 |
| **データ量** | < 1GB | 10GB | パーティショニング検討 |
| **データ量** | 10GB | 100GB | アーカイブ戦略実施 |
| **AIリクエスト** | ~50/day | 1,000/day | バッチ処理 + キャッシュ強化 |

### 5.2 Vercel Serverless の制約

| 項目 | Free | Pro | Enterprise |
|------|------|-----|-----------|
| **Function実行時間** | 10s | 60s | 900s |
| **Function メモリ** | 1024MB | 3008MB | 3008MB |
| **Concurrent Executions** | 10 | 100 | Custom |
| **Bandwidth** | 100GB | 1TB | Custom |
| **Cron Jobs** | 2 | 40 | Custom |

---

## 6. Implementation Checklist (実装チェックリスト)

### Phase 69 導入順序

- [ ] **Step 1**: Upstash Redis のセットアップと接続確認
- [ ] **Step 2**: レート制限の実装（Upstash Ratelimit）
- [ ] **Step 3**: L2キャッシュの実装（頻繁に参照するエンティティから）
- [ ] **Step 4**: CDNヘッダーの最適化（next.config.ts）
- [ ] **Step 5**: Vercel Cron ジョブの設定（vercel.json）
- [ ] **Step 6**: べき等性キーの導入
- [ ] **Step 7**: バックグラウンドジョブのエラー通知設定
- [ ] **Step 8**: キャッシュヒット率のモニタリング開始

### 運用開始後の定期タスク

| 頻度 | タスク |
|------|-------|
| 毎日 | レート制限ログ確認（不正アクセス検出） |
| 週次 | キャッシュヒット率レビュー（目標 > 80%） |
| 月次 | バックグラウンドジョブの失敗率レビュー |
| 四半期 | スケーリングトリガー指標の見直し |

---

**Last Updated**: 2026-03-05
**Phase**: 69
**Status**: Design Complete
