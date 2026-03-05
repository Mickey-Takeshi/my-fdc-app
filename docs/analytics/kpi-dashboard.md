# Phase 60: KPI Dashboard Design

> FDC Modular Starter - Analytics: KPI Dashboard

---

## 1. SaaS KPI Definitions

### 1.1 Revenue Metrics

| KPI | 定義 | 計算式 | 目標値（シード期） |
|-----|------|--------|------------------|
| **MRR** | Monthly Recurring Revenue | SUM(月額サブスクリプション収益) | - |
| **ARR** | Annual Recurring Revenue | MRR x 12 | - |
| **ARPU** | Average Revenue Per User | MRR / 有料ユーザー数 | - |
| **ARPPU** | Average Revenue Per Paying User | MRR / 有料ユーザー数 | - |
| **New MRR** | 新規獲得MRR | SUM(新規サブスクリプション収益) | - |
| **Expansion MRR** | 拡張MRR | SUM(アップグレード差額) | - |
| **Churned MRR** | 解約MRR | SUM(解約ユーザーの直前MRR) | - |
| **Net New MRR** | 純増MRR | New MRR + Expansion MRR - Churned MRR | > 0 |

### 1.2 Growth Metrics

| KPI | 定義 | 計算式 | 目標値 |
|-----|------|--------|--------|
| **MRR Growth Rate** | MRR成長率 | (今月MRR - 前月MRR) / 前月MRR x 100 | > 15%/月 |
| **User Growth Rate** | ユーザー成長率 | (今月ユーザー - 前月ユーザー) / 前月ユーザー x 100 | > 20%/月 |
| **Signup Rate** | サインアップ率 | 新規登録数 / LP訪問数 x 100 | > 3% |
| **Activation Rate** | 活性化率 | Aha Moment到達数 / 新規登録数 x 100 | > 40% |
| **Week 1 Retention** | 1週間継続率 | 7日後アクティブ / 新規登録数 x 100 | > 35% |
| **NRR** | Net Revenue Retention | (期初MRR + Expansion - Churn) / 期初MRR x 100 | > 100% |

### 1.3 Efficiency Metrics

| KPI | 定義 | 計算式 | 目標値 |
|-----|------|--------|--------|
| **LTV** | Lifetime Value | ARPU x 平均継続月数 | - |
| **CAC** | Customer Acquisition Cost | マーケ費用合計 / 新規有料ユーザー数 | - |
| **LTV/CAC** | LTV対CAC比率 | LTV / CAC | > 3.0 |
| **CAC Payback** | CAC回収期間 | CAC / ARPU（月数） | < 12ヶ月 |
| **Gross Margin** | 粗利率 | (MRR - インフラ費) / MRR x 100 | > 70% |
| **Burn Rate** | 月間バーンレート | 月間支出 - 月間収入 | 低下傾向 |
| **Runway** | 残存期間 | 現金残高 / Burn Rate | > 18ヶ月 |

### 1.4 Churn Metrics

| KPI | 定義 | 計算式 | 目標値 |
|-----|------|--------|--------|
| **Logo Churn Rate** | ユーザー解約率 | 解約ユーザー数 / 期初ユーザー数 x 100 | < 5%/月 |
| **Revenue Churn Rate** | 収益解約率 | Churned MRR / 期初MRR x 100 | < 3%/月 |
| **Net Revenue Churn** | 純収益解約率 | (Churned MRR - Expansion MRR) / 期初MRR x 100 | < 0%（ネガティブチャーン） |
| **DAU/MAU** | Stickiness | Daily Active Users / Monthly Active Users | > 0.3 |
| **Health Score** | ヘルススコア | 独自算出（Phase 58 参照） | 平均 > 70 |

---

## 2. AARRR Funnel Design

### 2.1 ファネル定義

```
+------------------------------------------+
|  ACQUISITION（獲得）                       |
|  LP訪問 -> サインアップ                     |
|  Target: Signup Rate > 3%                 |
+------------------------------------------+
           |
           v
+------------------------------------------+
|  ACTIVATION（活性化）                      |
|  初回ログイン -> Aha Moment到達             |
|  Target: Activation Rate > 40%            |
+------------------------------------------+
           |
           v
+------------------------------------------+
|  RETENTION（継続）                         |
|  Day 1 / Day 7 / Day 30 再訪問             |
|  Target: Day 7 Retention > 35%            |
+------------------------------------------+
           |
           v
+------------------------------------------+
|  REVENUE（収益化）                         |
|  Free -> Pro / Enterprise 変換             |
|  Target: Conversion Rate > 5%             |
+------------------------------------------+
           |
           v
+------------------------------------------+
|  REFERRAL（紹介）                          |
|  ユーザー招待・口コミ                       |
|  Target: Referral Rate > 10%              |
+------------------------------------------+
```

### 2.2 ファネルステージ別メトリクス

| ステージ | Primary Metric | Secondary Metrics | 計測イベント |
|---------|---------------|-------------------|-------------|
| **Acquisition** | サインアップ数 | LP訪問数, Signup Rate, チャネル別CVR | `signup_started`, `signup_completed` |
| **Activation** | Aha Moment到達率 | オンボーディング完了率, Time-to-Value | `onboarding_step_completed`, `task_created` |
| **Retention** | Day 7 Retention | DAU/MAU, セッション頻度, 機能利用率 | `page_viewed`, 各機能イベント |
| **Revenue** | MRR | ARPU, Conversion Rate, Expansion Rate | `subscription_started`, `subscription_upgraded` |
| **Referral** | 招待送信数 | 招待承諾率, Viral Coefficient | `member_invited`, `invitation_accepted` |

### 2.3 ファネル分析クエリ

```sql
-- AARRR ファネル（月次）
WITH monthly_cohort AS (
  SELECT
    DATE_TRUNC('month', created_at) AS cohort_month,
    id AS user_id
  FROM auth.users
  WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '6 months'
),
funnel AS (
  SELECT
    mc.cohort_month,
    COUNT(DISTINCT mc.user_id) AS signups,
    -- Activation: タスク作成済み
    COUNT(DISTINCT CASE
      WHEN EXISTS (
        SELECT 1 FROM tasks t WHERE t.user_id = mc.user_id
      ) THEN mc.user_id
    END) AS activated,
    -- Retention: 7日後にアクティブ
    COUNT(DISTINCT CASE
      WHEN EXISTS (
        SELECT 1 FROM auth.sessions s
        WHERE s.user_id = mc.user_id
          AND s.created_at BETWEEN mc.cohort_month + INTERVAL '7 days'
                               AND mc.cohort_month + INTERVAL '14 days'
      ) THEN mc.user_id
    END) AS retained_d7,
    -- Revenue: 有料プラン
    COUNT(DISTINCT CASE
      WHEN EXISTS (
        SELECT 1 FROM subscriptions sub
        WHERE sub.user_id = mc.user_id
          AND sub.status = 'active'
      ) THEN mc.user_id
    END) AS paying
  FROM monthly_cohort mc
  GROUP BY mc.cohort_month
)
SELECT
  cohort_month,
  signups,
  activated,
  ROUND(activated::numeric / NULLIF(signups, 0) * 100, 1) AS activation_rate,
  retained_d7,
  ROUND(retained_d7::numeric / NULLIF(signups, 0) * 100, 1) AS retention_rate,
  paying,
  ROUND(paying::numeric / NULLIF(signups, 0) * 100, 1) AS conversion_rate
FROM funnel
ORDER BY cohort_month DESC;
```

---

## 3. Dashboard Layout

### 3.1 メインダッシュボード

```
+================================================================+
|  FDC Analytics Dashboard                    [Daily] [Weekly] [Monthly]
+================================================================+
|                                                                 |
|  +--- Revenue ---+  +--- Users ---+  +--- Health ---+  +--- Churn ---+
|  | MRR           |  | MAU         |  | Avg Score    |  | Logo Churn  |
|  | $12,450       |  | 1,234       |  | 72.5         |  | 4.2%        |
|  | +15.3% MoM    |  | +22% MoM   |  | +3.1 MoM     |  | -0.8% MoM  |
|  +---------------+  +------------+  +-------------+  +------------+
|                                                                 |
|  +--- MRR Trend (12M) -----------------------------------------+
|  |                                                    ___---    |
|  |                                            ___---/          |
|  |                                    ___---/                  |
|  |                            ___---/                          |
|  |                    ___---/                                  |
|  |            ___---/                                          |
|  |    ___---/                                                  |
|  | --/                                                         |
|  |  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec  Jan  Feb |
|  +------------------------------------------------------------|
|                                                                 |
|  +--- AARRR Funnel ---+  +--- MRR Breakdown ----------------+ |
|  | Signup     1,000    |  | +---+---+---+---+---+---+---+    | |
|  | ||||||||||||||||    |  | |   |   |   |   |   |   |   |    | |
|  | Activated    420    |  | | N | N | N | N | N | N | N |    | |
|  | |||||||||           |  | | e | e | e | e | e | e | e |    | |
|  | Retained     180    |  | | w | w | w | w | w | w | w |    | |
|  | |||||               |  | |   |   |   |   |   |   |   |    | |
|  | Paying        52    |  | | E | E | E | E | E | E | E |    | |
|  | ||                  |  | |   |   |   |   |   |   |   |    | |
|  | Referral       8    |  | +---+---+---+---+---+---+---+    | |
|  | |                   |  |  New  Expansion  Churned          | |
|  +--------------------+  +----------------------------------+ |
|                                                                 |
|  +--- Cohort Retention Heatmap --------------------------------+
|  |         W1    W2    W3    W4    W5    W6    W7    W8        |
|  | Jan-26  42%   35%   30%   28%   27%   26%   25%   25%      |
|  | Feb-26  45%   38%   33%   30%   29%   28%   -     -        |
|  | Mar-26  48%   40%   -     -     -     -     -     -        |
|  +------------------------------------------------------------+
|                                                                 |
+================================================================+
```

### 3.2 表示要素

| セクション | 表示項目 | 更新頻度 | データソース |
|-----------|---------|---------|-------------|
| **Revenue Cards** | MRR, ARR, ARPU, Net New MRR | リアルタイム | Stripe + PostHog |
| **User Cards** | MAU, DAU, New Users, Active Rate | リアルタイム | PostHog |
| **Health Cards** | Avg Health Score, At-Risk Count | 日次 | 独自計算 |
| **Churn Cards** | Logo Churn, Revenue Churn, NRR | 月次 | Stripe + PostHog |
| **MRR Trend** | 12ヶ月MRR推移チャート | 日次 | Stripe |
| **AARRR Funnel** | ファネルステージ別ユーザー数 | リアルタイム | PostHog |
| **MRR Breakdown** | New/Expansion/Churned MRR 内訳 | 月次 | Stripe |
| **Cohort Heatmap** | 週次コホートリテンション | 週次 | PostHog |

### 3.3 アラート設定

| アラート名 | 条件 | 通知先 | 重要度 |
|-----------|------|--------|--------|
| **MRR急落** | 前日比 -10% 以上 | Slack #alerts + メール | Critical |
| **チャーン急増** | 週次解約率が前週比 +50% | Slack #alerts | High |
| **Activation低下** | 日次Activation Rate < 30% | Slack #metrics | Medium |
| **エラー率上昇** | API エラー率 > 5% | Slack #alerts + PagerDuty | Critical |
| **Retention低下** | Day 7 Retention < 25% | Slack #metrics | High |
| **Health Score低下** | 平均Health Score < 60 | Slack #metrics | Medium |
| **新規ユーザー急減** | 日次サインアップ < 前週平均 50% | Slack #metrics | Medium |
| **大口顧客アラート** | Enterprise顧客のHealth Score < 50 | Slack #alerts + メール | Critical |

---

## 4. Auto-Report Design

### 4.1 レポート種別

| レポート | 配信頻度 | 配信先 | 目的 |
|---------|---------|--------|------|
| **Daily Pulse** | 毎日 9:00 | Slack #daily-metrics | 日次の健全性チェック |
| **Weekly Report** | 毎週月曜 9:00 | Slack #weekly-report + メール | 週次トレンド分析 |
| **Monthly Report** | 毎月1日 9:00 | メール（経営チーム） | 月次経営レビュー |

### 4.2 Daily Pulse

```
[Daily Pulse] 2026-03-05

Revenue:  MRR $12,450 (+$120)
Users:    DAU 156 | MAU 1,234 | New 23
Funnel:   Signup 45 -> Activated 19 (42%)
Health:   Avg 72.5 | At-Risk 8
Errors:   API Error Rate 0.3%
```

### 4.3 Weekly Report Template

```
============================================
  FDC Weekly Report
  2026-02-24 ~ 2026-03-02
============================================

## Revenue Summary
  MRR:          $12,450 (+3.2% WoW)
  Net New MRR:  +$385
    New:        +$520 (8 new subscribers)
    Expansion:  +$65 (2 upgrades)
    Churned:    -$200 (3 cancellations)
  ARR:          $149,400

## User Metrics
  Total Users:  2,456 (+89 WoW)
  MAU:          1,234 (+5.1% WoW)
  DAU (avg):    156 (+8.3% WoW)
  DAU/MAU:      0.126

## AARRR Funnel (This Week)
  Signups:      89
  Activated:    38 (42.7%)
  Retained D7:  32 (35.9%)
  Converted:    8 (9.0%)
  Referred:     3 (3.4%)

## Retention Cohort
  This Week Cohort:
    D1: 62% | D3: 48% | D7: 36%
  vs Last Week:
    D1: 58% | D3: 45% | D7: 33%
  Trend: Improving

## Health Score Distribution
  Healthy (80-100):    456 users (37%)
  Moderate (50-79):    523 users (42%)
  At-Risk (20-49):     198 users (16%)
  Critical (0-19):      57 users (5%)

## Top Events This Week
  1. task_created:        1,234 events
  2. page_viewed:         8,901 events
  3. lead_created:          456 events
  4. action_map_created:    123 events
  5. okr_created:            89 events

## Alerts Triggered
  - [High] Churn spike on 02/26 (5 cancellations)
  - [Medium] Activation rate dropped below 35% on 02/28

## Action Items
  - [ ] Investigate churn spike on 02/26
  - [ ] Review activation flow for drop-off analysis
  - [ ] Follow up with at-risk Enterprise accounts
============================================
```

### 4.4 Monthly Report 追加セクション

Weekly Report の内容に加え、以下を追加:

| セクション | 内容 |
|-----------|------|
| **LTV/CAC 分析** | LTV, CAC, LTV/CAC比率, CAC Payback期間 |
| **コホート分析** | 月次コホート別リテンション推移 |
| **Churn Analysis** | 解約理由内訳, 復帰率 |
| **Feature Adoption** | 機能別利用率ランキング, 新機能の採用曲線 |
| **NPS/CSAT** | 顧客満足度スコア推移 |
| **Runway Update** | 残存期間, バーンレート推移 |
| **OKR Progress** | チームOKR進捗 |

---

## 5. Dashboard 実装設計

### 5.1 データパイプライン

```
Data Sources              Processing              Display
+-----------+            +----------+            +----------+
| PostHog   |---events-->| Aggregate|---cache--->| Dashboard|
| (events)  |            | Worker   |   (Redis)  | (React)  |
+-----------+            +----------+            +----------+
| Stripe    |---webhook->| Webhook  |---DB------>|          |
| (billing) |            | Handler  |  (metrics) |          |
+-----------+            +----------+            +----------+
| Supabase  |---query--->| SQL      |---cache--->|          |
| (app data)|            | Views    |   (Redis)  |          |
+-----------+            +----------+            +----------+
```

### 5.2 メトリクス集計テーブル

```sql
-- 日次メトリクス集計テーブル
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (metric_date, metric_name)
);

-- インデックス
CREATE INDEX idx_daily_metrics_date ON daily_metrics (metric_date DESC);
CREATE INDEX idx_daily_metrics_name ON daily_metrics (metric_name, metric_date DESC);

-- 月次メトリクス集計テーブル
CREATE TABLE IF NOT EXISTS monthly_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_month DATE NOT NULL, -- 月初日
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (metric_month, metric_name)
);
```

### 5.3 メトリクス集計関数

```sql
-- MRR計算（月次）
CREATE OR REPLACE FUNCTION calculate_mrr(target_date DATE)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN s.billing_period = 'monthly' THEN s.price
      WHEN s.billing_period = 'yearly' THEN s.price / 12
    END
  ), 0)
  FROM subscriptions s
  WHERE s.status = 'active'
    AND s.current_period_start <= target_date
    AND s.current_period_end >= target_date;
$$ LANGUAGE sql STABLE;

-- DAU計算
CREATE OR REPLACE FUNCTION calculate_dau(target_date DATE)
RETURNS BIGINT AS $$
  SELECT COUNT(DISTINCT user_id)
  FROM auth.sessions
  WHERE created_at::date = target_date;
$$ LANGUAGE sql STABLE;
```

---

## 6. Implementation Checklist

### 6.1 データ基盤

- [ ] `daily_metrics` テーブル作成
- [ ] `monthly_metrics` テーブル作成
- [ ] メトリクス集計関数作成（MRR, DAU, MAU等）
- [ ] 日次集計バッチ（Supabase Edge Function / Cron）
- [ ] 月次集計バッチ
- [ ] PostHog -> メトリクス同期パイプライン

### 6.2 ダッシュボードUI

- [ ] ダッシュボードページ作成（`/admin/analytics`）
- [ ] KPI カードコンポーネント
- [ ] MRR トレンドチャート（Recharts / Chart.js）
- [ ] AARRR ファネルチャート
- [ ] MRR Breakdown スタックバー
- [ ] コホートリテンションヒートマップ
- [ ] 期間セレクター（Daily / Weekly / Monthly）

### 6.3 アラート

- [ ] アラートルールエンジン
- [ ] Slack Webhook 連携
- [ ] メール通知（Resend / SendGrid）
- [ ] アラート履歴テーブル

### 6.4 自動レポート

- [ ] Daily Pulse 生成 + Slack 配信
- [ ] Weekly Report 生成 + 配信
- [ ] Monthly Report 生成 + メール配信
- [ ] レポートテンプレートエンジン

### 6.5 検証

- [ ] メトリクス計算の正確性テスト
- [ ] ダッシュボード表示パフォーマンス（< 2秒）
- [ ] アラート発火テスト
- [ ] レポート生成テスト
- [ ] モバイル表示対応確認

---

**Last Updated**: 2026-03-05
**Phase**: 60
**Status**: Design Complete
