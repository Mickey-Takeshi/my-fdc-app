# Phase 70: Performance Monitoring Design

> FDC Modular Starter - パフォーマンスモニタリング設計

---

## 1. Load Test Design (負荷テスト設計)

### 1.1 テストシナリオ

| シナリオ | VUs | 期間 | 目的 |
|---------|-----|------|------|
| **Smoke** | 5 VUs | 1min | 基本動作確認、デプロイ後の簡易チェック |
| **Load** | 50 VUs | 10min | 通常負荷での性能検証 |
| **Stress** | 100-200 VUs | 15min | 限界性能の特定、ボトルネック検出 |
| **Spike** | 10->200 VUs | 1min | 急激なトラフィック増加への耐性 |

### 1.2 FDC対象エンドポイント

| エンドポイント | メソッド | テスト内容 | 期待レスポンス |
|--------------|---------|-----------|--------------|
| `/api/health` | GET | ヘルスチェック | < 50ms |
| `/api/tasks` | GET | タスク一覧取得 | < 200ms |
| `/api/tasks` | POST | タスク作成 | < 300ms |
| `/api/tasks/:id` | PATCH | タスク更新 | < 300ms |
| `/api/leads` | GET | リード一覧取得 | < 200ms |
| `/api/action-maps` | GET | ActionMap一覧 | < 200ms |
| `/api/objectives` | GET | OKR一覧 | < 200ms |
| `/api/admin/audit-logs` | GET | 監査ログ取得 | < 500ms |
| `/api/ai/*` | POST | AI機能 | < 5000ms |
| `/api/billing/webhook` | POST | Stripe Webhook | < 1000ms |

### 1.3 k6テストスクリプト例

```javascript
// tests/load/smoke-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const taskListDuration = new Trend('task_list_duration');

export const options = {
  // Smoke テスト設定
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

export default function () {
  // 1. ヘルスチェック
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health response < 50ms': (r) => r.timings.duration < 50,
  });

  // 2. タスク一覧取得
  const tasksRes = http.get(`${BASE_URL}/api/tasks`, { headers });
  taskListDuration.add(tasksRes.timings.duration);
  check(tasksRes, {
    'tasks status 200': (r) => r.status === 200,
    'tasks response < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(tasksRes.status !== 200);

  // 3. タスク作成
  const createRes = http.post(
    `${BASE_URL}/api/tasks`,
    JSON.stringify({
      title: `Load test task ${Date.now()}`,
      quadrant: 1,
      status: 'active',
    }),
    { headers }
  );
  check(createRes, {
    'create status 201': (r) => r.status === 201,
    'create response < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}
```

```javascript
// tests/load/stress-test.js
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // ランプアップ
    { duration: '5m', target: 100 },   // 通常負荷
    { duration: '3m', target: 200 },   // ストレス負荷
    { duration: '2m', target: 200 },   // 維持
    { duration: '3m', target: 0 },     // ランプダウン
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
    http_reqs: ['rate>100'],
  },
};
```

### 1.4 成功基準

| メトリクス | Smoke | Load | Stress | Spike |
|-----------|-------|------|--------|-------|
| **P95 レイテンシ** | < 500ms | < 500ms | < 1000ms | < 2000ms |
| **P99 レイテンシ** | < 1000ms | < 1000ms | < 2000ms | < 5000ms |
| **エラー率** | < 0.1% | < 1% | < 5% | < 10% |
| **スループット** | > 10 rps | > 100 rps | > 50 rps | > 30 rps |

### 1.5 テスト実行計画

| タイミング | テスト種別 | 実行環境 |
|-----------|-----------|---------|
| **PR マージ前** | Smoke | Staging |
| **リリース前** | Load + Stress | Staging |
| **月次** | Full Suite（全種別） | Staging |
| **四半期** | Stress + Spike | Staging（本番相当データ） |

---

## 2. SLO/SLI Design (SLO/SLI設計)

### 2.1 SLI定義

| SLI | 定義 | 計測方法 |
|-----|------|---------|
| **可用性** | 成功リクエスト数 / 総リクエスト数 | Vercel Analytics + Health Check |
| **レイテンシ P95** | 95パーセンタイル応答時間 | Vercel Function Duration |
| **エラー率** | 5xx レスポンス数 / 総リクエスト数 | Vercel Logs フィルタリング |
| **スループット** | 1秒あたりの処理リクエスト数 | Vercel Analytics |

### 2.2 SLO目標

| SLI | SLO目標 | 計測期間 |
|-----|---------|---------|
| **可用性** | 99.9%（月間ダウンタイム 43分以内） | 月次 |
| **API レイテンシ P95** | < 500ms | 月次 |
| **AI API レイテンシ P95** | < 5000ms | 月次 |
| **エラー率** | < 0.1% | 月次 |
| **ページロード P95** | < 3000ms | 月次 |
| **スループット** | > 100 rps（ピーク時） | 日次 |

### 2.3 エラーバジェット

| SLO | 月間エラーバジェット | 週間エラーバジェット |
|-----|-------------------|--------------------|
| **99.9% 可用性** | 43分 | 約10分 |
| **99.95% 可用性** | 21分 | 約5分 |
| **99.99% 可用性** | 4.3分 | 約1分 |

#### エラーバジェット消費率の計算

```typescript
// エラーバジェットの計算
interface ErrorBudget {
  sloTarget: number;        // 例: 0.999
  periodDays: number;        // 例: 30
  totalMinutes: number;      // 例: 43200 (30日)
  budgetMinutes: number;     // 例: 43.2
  consumedMinutes: number;   // 実績
  remainingMinutes: number;  // 残り
  consumptionRate: number;   // 消費率 (%)
}

function calculateErrorBudget(
  sloTarget: number,
  periodDays: number,
  downtimeMinutes: number
): ErrorBudget {
  const totalMinutes = periodDays * 24 * 60;
  const budgetMinutes = totalMinutes * (1 - sloTarget);
  const remainingMinutes = budgetMinutes - downtimeMinutes;
  const consumptionRate = (downtimeMinutes / budgetMinutes) * 100;

  return {
    sloTarget,
    periodDays,
    totalMinutes,
    budgetMinutes,
    consumedMinutes: downtimeMinutes,
    remainingMinutes,
    consumptionRate,
  };
}
```

### 2.4 SLOブリーチ時のアクション

| エラーバジェット消費率 | 状態 | アクション |
|---------------------|------|-----------|
| **< 50%** | 正常 | 通常開発を継続 |
| **50-75%** | 注意 | 新機能デプロイの慎重化、根本原因調査 |
| **75-100%** | 警戒 | 新機能デプロイ凍結、安定化に集中 |
| **> 100%** | SLO違反 | インシデント対応、ポストモーテム必須 |

---

## 3. Monitoring Design (モニタリング設計)

### 3.1 モニタリング項目

#### アプリケーションメトリクス

| 項目 | 計測方法 | アラート閾値 |
|------|---------|-------------|
| API レスポンスタイム | Vercel Function Duration | P95 > 500ms |
| エラー率 | Vercel Logs (5xx count) | > 1% |
| Function 実行時間 | Vercel Analytics | > 30s |
| メモリ使用量 | Function Memory | > 80% |

#### インフラメトリクス

| 項目 | 計測方法 | アラート閾値 |
|------|---------|-------------|
| DB接続数 | Supabase Dashboard | > 80% |
| DB CPU使用率 | Supabase Metrics | > 70% |
| DBディスク使用量 | Supabase Dashboard | > 80% |
| Redis メモリ使用量 | Upstash Dashboard | > 70% |
| Vercel Bandwidth | Vercel Analytics | > 80% |

#### ビジネスメトリクス

| 項目 | 計測方法 | アラート閾値 |
|------|---------|-------------|
| ログイン成功率 | カスタムログ | < 95% |
| タスク作成数 | DB集計 | 前日比 50% 減 |
| AI機能利用数 | ai_usage_logs | 前日比 50% 減 |
| Webhook処理成功率 | カスタムログ | < 99% |

#### AIメトリクス

| 項目 | 計測方法 | アラート閾値 |
|------|---------|-------------|
| AIレイテンシ P95 | ai_usage_logs | > 5000ms |
| AIエラー率 | ai_usage_logs | > 5% |
| 日次AIコスト | ai_usage_daily | > 予算の120% |
| トークン使用量 | ai_usage_logs | > 日次上限の90% |

### 3.2 ダッシュボードレイアウト

```
+------------------------------------------------------------------+
|                    FDC Monitoring Dashboard                       |
+------------------------------------------------------------------+
|                                                                  |
|  +--- Overview ---+  +--- SLO Status ---+  +--- Alerts ---+     |
|  | Uptime: 99.95% |  | Availability: OK |  | Critical: 0  |     |
|  | RPS: 45        |  | Latency: OK      |  | Warning: 2   |     |
|  | Errors: 0.02%  |  | Error Rate: OK   |  | Info: 5       |     |
|  | P95: 234ms     |  | Budget: 72%      |  |               |     |
|  +----------------+  +------------------+  +---------------+     |
|                                                                  |
|  +--- API Latency (P95/P99) ---+  +--- Error Rate --------+     |
|  |                              |  |                        |     |
|  | 500ms ......                 |  | 1.0% ......            |     |
|  | 400ms ......                 |  | 0.8% ......            |     |
|  | 300ms ....****.....           |  | 0.6% ......            |     |
|  | 200ms .**......**..           |  | 0.4% ......            |     |
|  | 100ms **.........**           |  | 0.2% ...*.......       |     |
|  |   0ms +--+--+--+--+          |  | 0.0% **..........      |     |
|  |       0h 6h 12h 24h          |  |      0h 6h 12h 24h    |     |
|  +------------------------------+  +------------------------+     |
|                                                                  |
|  +--- DB Connections ---+  +--- AI Usage ----------------+       |
|  |                       |  |                             |       |
|  | Max: 100              |  | Requests: 1,234 today      |       |
|  | Active: 23             |  | Tokens: 2.3M today         |       |
|  | Idle: 45               |  | Cost: $12.50 today         |       |
|  | Available: 32          |  | Avg Latency: 1,200ms      |       |
|  +-----------------------+  +-----------------------------+       |
|                                                                  |
|  +--- Recent Incidents ----------------------------------------+ |
|  | 2026-03-04 14:30 | WARNING | P95 latency spike (450ms)     | |
|  | 2026-03-03 09:15 | INFO    | Cron job delayed (2min)       | |
|  +-------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### 3.3 ログ収集設計

| ログ種別 | 収集先 | 保持期間 | 形式 |
|---------|--------|---------|------|
| **Vercel Function Logs** | Vercel Logs | 7日（Free）/ 30日（Pro） | 構造化JSON |
| **アプリケーションログ** | pino + Vercel Logs | 7日 | 構造化JSON |
| **監査ログ** | Supabase DB | 90日 | DB レコード |
| **AIログ** | Supabase DB | 30日 | DB レコード |

#### pino 構造化ロギング設定

```typescript
// lib/server/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'fdc-app',
    environment: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// API Route での使用例
export function createRequestLogger(
  request: NextRequest,
  routeName: string
) {
  return logger.child({
    route: routeName,
    method: request.method,
    url: request.url,
    requestId: crypto.randomUUID(),
  });
}

// 使用例
// const log = createRequestLogger(request, '/api/tasks');
// log.info({ taskId }, 'Task created successfully');
// log.error({ error: err.message }, 'Failed to create task');
```

---

## 4. Alert Design (アラート設計)

### 4.1 アラートルール

| ルール | 条件 | 重大度 | 通知先 |
|--------|------|--------|--------|
| **可用性低下** | availability < 99.5%（5分間） | Critical | Slack + Email + PagerDuty |
| **レイテンシ悪化** | P95 > 1000ms（10分間） | Warning | Slack |
| **レイテンシ危険** | P95 > 3000ms（5分間） | Critical | Slack + Email |
| **エラー率上昇** | error rate > 1%（5分間） | Critical | Slack + Email |
| **エラー率注意** | error rate > 0.5%（10分間） | Warning | Slack |
| **DB接続枯渇** | connections > 80%（5分間） | Critical | Slack + Email |
| **AIコスト超過** | daily cost > budget * 1.2 | Warning | Slack |
| **AIレイテンシ** | AI P95 > 10000ms（10分間） | Warning | Slack |
| **Cron失敗** | cron job failure | Warning | Slack |
| **Webhook失敗** | webhook error rate > 5% | Critical | Slack + Email |
| **ディスク使用量** | disk usage > 80% | Warning | Slack |
| **エラーバジェット** | budget consumed > 75% | Warning | Slack + Email |

### 4.2 通知テンプレート

#### Critical アラート

```
[CRITICAL] FDC Production Alert

Service: FDC Modular Starter
Environment: Production
Severity: CRITICAL

Alert: API Availability Below Threshold
Current Value: 99.2% (threshold: 99.5%)
Duration: 7 minutes

Impact:
- Estimated affected users: ~50
- Error budget consumption: +15 minutes

Action Required:
1. Check Vercel Functions status
2. Verify Supabase connectivity
3. Review recent deployments

Dashboard: https://vercel.com/fdc/analytics
Runbook: docs/guides/INCIDENT-RESPONSE.md
```

#### Warning アラート

```
[WARNING] FDC Performance Alert

Service: FDC Modular Starter
Environment: Production
Severity: WARNING

Alert: API Latency P95 Elevated
Current Value: 1,200ms (threshold: 1,000ms)
Duration: 12 minutes

Potential Causes:
- Database query performance degradation
- Increased traffic volume
- External service latency

Suggested Actions:
1. Check pg_stat_statements for slow queries
2. Review current connection pool usage
3. Check external service status (Stripe, Google APIs)
```

### 4.3 アラート疲労対策

| 対策 | 説明 | 設定 |
|------|------|------|
| **グルーピング** | 同一ルールのアラートを1通知にまとめる | 5分ウィンドウ |
| **サプレッション** | 同一アラートの連続通知を抑制 | 30分間隔 |
| **段階的通知** | 重大度に応じて通知先を変更 | Warning: Slack, Critical: Slack+Email |
| **月次レビュー** | アラートルールの有効性を定期見直し | 毎月第1月曜 |
| **ノイズ削減** | 誤検知率が高いアラートの閾値調整 | 月次レビュー時 |
| **営業時間考慮** | 非営業時間はCriticalのみ通知 | 22:00-08:00 |

---

## 5. Incident Response (インシデント対応)

### 5.1 インシデント対応フロー

```
検知                判断              対応              解決
+--------+      +--------+      +--------+      +--------+
| Alert  |----->| Triage |----->| Action |----->| Resolve|
| 発報    |      | 判断    |      | 対応    |      | 解決   |
+--------+      +--------+      +--------+      +--------+
                    |                |                |
                    v                v                v
              +---------+     +---------+     +-----------+
              | Classify|     | Execute |     | Postmortem|
              | 分類     |     | 実行    |     | 振り返り   |
              +---------+     +---------+     +-----------+
              |  P1: 15min  |  | Rollback  |  | 48h以内   |
              |  P2: 30min  |  | Hotfix    |  | 作成      |
              |  P3: 4h     |  | Scale     |  |           |
              |  P4: 24h   |  | Notify    |  |           |
              +------------+  +----------+  +-----------+

対応時間目標:
  P1 (Critical): 検知から15分以内に初動
  P2 (High):     検知から30分以内に初動
  P3 (Medium):   検知から4時間以内に対応開始
  P4 (Low):      次営業日中に対応
```

### 5.2 インシデント重大度分類

| 重大度 | 影響 | 例 | 対応時間 |
|--------|------|-----|---------|
| **P1 Critical** | サービス全停止、データ損失リスク | DB接続不可、認証障害 | 15分 |
| **P2 High** | 主要機能の障害 | タスク作成不可、AI機能停止 | 30分 |
| **P3 Medium** | 一部機能の劣化 | レイテンシ悪化、Cron失敗 | 4時間 |
| **P4 Low** | 軽微な影響 | UIの表示崩れ、ログ欠損 | 24時間 |

### 5.3 オンコール体制

| 項目 | 設定 |
|------|------|
| **ローテーション** | 週次交代 |
| **一次対応** | オンコール担当（Slack + Email） |
| **エスカレーション** | 30分未応答でバックアップ担当に通知 |
| **営業時間外** | P1/P2のみ通知、P3/P4は翌営業日 |
| **引き継ぎ** | 月曜 10:00 にオンコールハンドオフ |

---

## 6. Implementation Checklist (実装チェックリスト)

### Phase 70 導入順序

- [ ] **Step 1**: k6テストスクリプトの作成（Smoke テストから）
- [ ] **Step 2**: SLI計測の自動化（Vercel Analytics + カスタムメトリクス）
- [ ] **Step 3**: SLO目標の設定とエラーバジェット計算の自動化
- [ ] **Step 4**: pino構造化ロギングの全APIルートへの適用
- [ ] **Step 5**: アラートルールの設定（Slack Webhook連携）
- [ ] **Step 6**: モニタリングダッシュボードの構築
- [ ] **Step 7**: インシデント対応フローのチーム共有と訓練
- [ ] **Step 8**: 月次パフォーマンスレビュープロセスの確立

### 運用開始後の定期タスク

| 頻度 | タスク |
|------|-------|
| 毎日 | アラート発報状況の確認 |
| 週次 | SLO達成状況とエラーバジェット消費率の確認 |
| 月次 | 負荷テスト実施 + アラートルール見直し |
| 四半期 | SLO目標の妥当性レビュー + 負荷テスト全種別実施 |

---

**Last Updated**: 2026-03-05
**Phase**: 70
**Status**: Design Complete
