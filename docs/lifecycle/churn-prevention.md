# Phase 58: Churn Prevention

> FDC Modular Starter - Customer Lifecycle: Churn Prevention

---

## 1. Risk Signal Definition

### 1.1 Risk Signal Table

| Risk Signal | Weight | Measurement | Threshold (At Risk) | Threshold (Critical) |
|------------|--------|-------------|---------------------|---------------------|
| Login Frequency | 30% | 過去14日間のログイン日数 | < 3日 | < 1日 |
| Feature Usage | 25% | 過去14日間のコア機能利用数 | < 5回 | < 1回 |
| Support Tickets | 20% | 過去30日間の未解決チケット数 | >= 2件 | >= 4件 |
| NPS Score | 25% | 直近のNPSスコア | 6以下 (Passive) | 3以下 (Detractor) |

### 1.2 Risk Signal Calculation

```sql
-- Risk Signal Score Calculation per User
WITH signals AS (
  SELECT
    u.id AS user_id,
    u.email,

    -- Login Frequency (30%)
    COALESCE((
      SELECT COUNT(DISTINCT DATE(created_at))
      FROM auth.sessions s
      WHERE s.user_id = u.id
        AND s.created_at >= NOW() - INTERVAL '14 days'
    ), 0) AS login_days_14d,

    -- Feature Usage (25%)
    COALESCE((
      SELECT COUNT(*)
      FROM feature_events fe
      WHERE fe.user_id = u.id
        AND fe.created_at >= NOW() - INTERVAL '14 days'
        AND fe.feature IN ('tasks', 'leads', 'action_maps', 'okr')
    ), 0) AS feature_usage_14d,

    -- Support Tickets (20%)
    COALESCE((
      SELECT COUNT(*)
      FROM support_tickets st
      WHERE st.user_id = u.id
        AND st.status = 'open'
        AND st.created_at >= NOW() - INTERVAL '30 days'
    ), 0) AS open_tickets_30d,

    -- NPS Score (25%)
    COALESCE((
      SELECT score
      FROM nps_responses nr
      WHERE nr.user_id = u.id
      ORDER BY nr.created_at DESC
      LIMIT 1
    ), 7) AS latest_nps

  FROM auth.users u
)
SELECT
  user_id,
  email,
  login_days_14d,
  feature_usage_14d,
  open_tickets_30d,
  latest_nps,
  -- Calculate weighted risk score (lower = higher risk)
  ROUND(
    (LEAST(login_days_14d / 7.0, 1.0) * 30) +
    (LEAST(feature_usage_14d / 10.0, 1.0) * 25) +
    (GREATEST(1.0 - open_tickets_30d / 5.0, 0.0) * 20) +
    (LEAST(latest_nps / 10.0, 1.0) * 25)
  , 1) AS health_score
FROM signals
ORDER BY health_score ASC;
```

---

## 2. Health Score

### 2.1 Health Score Calculation

**Health Score = 100 - (Risk Deductions)**

| Signal | Full Score | Deduction Formula |
|--------|-----------|-------------------|
| Login Frequency | 30 pts | 30 - (login_days_14d / 7 * 30) が負なら0 |
| Feature Usage | 25 pts | 25 - (feature_usage_14d / 10 * 25) が負なら0 |
| Support Tickets | 20 pts | min(open_tickets * 5, 20) を減点 |
| NPS Score | 25 pts | 25 - (nps_score / 10 * 25) が負なら0 |

### 2.2 Health Score Segments

| Segment | Score Range | Color | Population (est.) | Description |
|---------|-----------|-------|-------------------|-------------|
| **Healthy** | 75 - 100 | Green | 45% | アクティブに利用中。維持施策のみ |
| **At Risk** | 50 - 74 | Yellow | 25% | 利用低下傾向。早期介入が必要 |
| **Critical** | 25 - 49 | Orange | 18% | 離脱の兆候あり。即座の対応が必要 |
| **Churning** | 0 - 24 | Red | 12% | 離脱直前/離脱済み。特別対応 |

### 2.3 Health Score Visualization

```
  Health Score Distribution
  ━━━━━━━━━━━━━━━━━━━━━━━

  Healthy  (75-100) ████████████████████░░░░░  45%
  At Risk  (50-74)  ████████████░░░░░░░░░░░░░  25%
  Critical (25-49)  █████████░░░░░░░░░░░░░░░░  18%
  Churning  (0-24)  ██████░░░░░░░░░░░░░░░░░░░  12%
```

---

## 3. Segment Response Matrix

| Segment | Auto Response | Human Response | Frequency | Escalation |
|---------|--------------|---------------|-----------|------------|
| **Healthy** | 週次サマリーメール、新機能通知 | なし | 週1回 | - |
| **At Risk** | パーソナライズド Tips メール、未完了タスクリマインド | CSM月次レビュー | 週2回 | 2週間改善なし → Critical対応 |
| **Critical** | 特別オファーメール、1on1 招待 | CSM即日連絡、電話/ミーティング | 即座 + 週3回 | 1週間改善なし → エグゼクティブ対応 |
| **Churning** | ラストチャンスオファー、アンケート | エグゼクティブ連絡 | 即座 | 解約フロー移行 |

---

## 4. Cancellation Flow

### 4.1 Cancellation Flow UI Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  解約手続き                                     [X]     │
│─────────────────────────────────────────────────────────│
│                                                          │
│  解約の理由を教えてください                              │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 解約理由を選択してください               [v]    │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  料金が高い                                     │    │
│  │  あまり使っていない                             │    │
│  │  必要な機能がない                               │    │
│  │  他のサービスに乗り換える                       │    │
│  │  一時的に利用を停止したい                       │    │
│  │  その他                                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 詳しく教えてください（任意）                    │    │
│  │                                                  │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ─────────────────────────────────────────────────      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  特別オファー                                   │    │
│  │                                                  │    │
│  │  解約の前に...                                   │    │
│  │  次の3ヶ月間、50%OFFでご利用いただけます。       │    │
│  │                                                  │    │
│  │  ┌────────────────────────────────────┐          │    │
│  │  │  50%OFFで続ける                    │          │    │
│  │  └────────────────────────────────────┘          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ─────────────────────────────────────────────────      │
│                                                          │
│  プランのダウングレードも可能です                        │
│  ┌────────────────────────────────────┐                  │
│  │  Free プランにダウングレード       │                  │
│  └────────────────────────────────────┘                  │
│                                                          │
│  ┌──────────────┐    ┌──────────────────────────┐       │
│  │ 解約を確定   │    │  キャンセル（解約しない） │       │
│  └──────────────┘    └──────────────────────────┘       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Cancellation Reasons

| Reason Code | Label (JP) | Label (EN) | Category |
|------------|-----------|-----------|----------|
| `too-expensive` | 料金が高い | Too expensive | Pricing |
| `not-using` | あまり使っていない | Not using enough | Engagement |
| `missing-features` | 必要な機能がない | Missing features | Product |
| `competitor` | 他のサービスに乗り換える | Switching to competitor | Competition |
| `temporary` | 一時的に利用を停止したい | Temporary pause | Temporary |
| `other` | その他 | Other | Other |

### 4.3 Cancellation Reason Analytics

```sql
-- Cancellation Reasons Breakdown (Last 90 days)
SELECT
  reason_code,
  reason_label,
  COUNT(*) AS cancellations,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) AS percentage,
  ROUND(AVG(subscription_months), 1) AS avg_lifetime_months,
  ROUND(AVG(monthly_revenue), 0) AS avg_mrr_lost
FROM cancellations
WHERE cancelled_at >= NOW() - INTERVAL '90 days'
GROUP BY reason_code, reason_label
ORDER BY cancellations DESC;
```

---

## 5. Retention Tactics Matrix

### 5.1 Tactics by Cancellation Reason

| Reason | Primary Tactic | Secondary Tactic | Offer | Success Rate (est.) |
|--------|---------------|-----------------|-------|-------------------|
| **too-expensive** | 割引オファー（3ヶ月50%OFF） | ダウングレード提案 | 50% OFF x 3mo | 35% |
| **not-using** | 1on1オンボーディング再実施 | 使い方 Tips メール | 無料延長1ヶ月 | 25% |
| **missing-features** | ロードマップ共有 + 優先開発約束 | Beta機能への早期アクセス | 機能リクエスト優先 | 20% |
| **competitor** | 競合比較資料 + 移行コスト説明 | 特別割引オファー | 年間20%OFF | 15% |
| **temporary** | 一時停止（Pause）オプション提供 | 復帰時特典の約束 | 最大3ヶ月Pause | 60% |
| **other** | CSMによる個別ヒアリング | フィードバックを元に改善 | ケースバイケース | 20% |

### 5.2 Retention Offer Escalation

```
Step 1: 理由に応じた自動オファー表示
  │
  ├── 承諾 → 解約回避成功（logged）
  │
  └── 拒否 → Step 2
       │
       Step 2: ダウングレード提案
       │
       ├── 承諾 → ダウングレード実行
       │
       └── 拒否 → Step 3
            │
            Step 3: 最終確認 + フィードバック収集
            │
            └── 解約確定 → Win-back フローへ移行
```

---

## 6. Win-back Strategy

### 6.1 Win-back Timing

| Timing | Days After Churn | Campaign Type | Goal |
|--------|-----------------|---------------|------|
| **Phase 1** | 30 days | Feature Update Email | 新機能で再興味喚起 |
| **Phase 2** | 60 days | Special Offer Email | 経済的インセンティブ |
| **Phase 3** | 90 days | Final Approach Email | ラストチャンス + アンケート |

### 6.2 Win-back Email Templates

#### Phase 1: Feature Update (30 days)

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  {name}さん、お元気ですか?                       │
│                                                  │
│  FDCに新機能が追加されました!                    │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━                    │
│                                                  │
│  ● [新機能1] の説明                              │
│  ● [新機能2] の説明                              │
│  ● [改善点] の説明                               │
│                                                  │
│  あなたのデータはそのまま保存されています。       │
│  いつでもお戻りいただけます。                    │
│                                                  │
│  ┌──────────────────────────────┐                │
│  │   もう一度試してみる         │                │
│  └──────────────────────────────┘                │
│                                                  │
│  配信停止                                        │
└─────────────────────────────────────────────────┘
```

#### Phase 2: Special Offer (60 days)

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  {name}さんへ特別なオファー                      │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━                    │
│                                                  │
│  ┌──────────────────────────────────────┐        │
│  │                                      │        │
│  │     Welcome Back 特別価格            │        │
│  │     3ヶ月間 50% OFF                  │        │
│  │                                      │        │
│  │     通常 ¥4,980/月 → ¥2,490/月      │        │
│  │                                      │        │
│  │     有効期限: 7日間                  │        │
│  │                                      │        │
│  └──────────────────────────────────────┘        │
│                                                  │
│  このオファーは{name}さん限定です。               │
│                                                  │
│  ┌──────────────────────────────┐                │
│  │   オファーを適用する         │                │
│  └──────────────────────────────┘                │
│                                                  │
│  配信停止                                        │
└─────────────────────────────────────────────────┘
```

#### Phase 3: Final Approach (90 days)

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  {name}さん、最後のご連絡です                    │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━                    │
│                                                  │
│  FDCを離れてから90日が経ちました。               │
│  あなたのアカウントとデータは                    │
│  引き続き安全に保存されています。                │
│                                                  │
│  最後にひとつだけお聞かせください:                │
│                                                  │
│  ┌──────────────────────────────────────┐        │
│  │ FDCを使わなくなった一番の理由は?     │        │
│  │                                      │        │
│  │ ○ 料金が合わなかった                 │        │
│  │ ○ 使い方がわからなかった             │        │
│  │ ○ 必要な機能がなかった               │        │
│  │ ○ 他ツールで十分だった               │        │
│  │ ○ ビジネス環境が変わった             │        │
│  │                                      │        │
│  │ [回答を送信]                         │        │
│  └──────────────────────────────────────┘        │
│                                                  │
│  いつでもお戻りをお待ちしています。              │
│                                                  │
│  ┌──────────────────────────────┐                │
│  │   アカウントを再開する       │                │
│  └──────────────────────────────┘                │
│                                                  │
│  今後のメールを停止する                          │
└─────────────────────────────────────────────────┘
```

### 6.3 Win-back Effectiveness Metrics

| Metric | Phase 1 (30d) | Phase 2 (60d) | Phase 3 (90d) | Overall |
|--------|--------------|--------------|--------------|---------|
| Email Open Rate (target) | > 30% | > 25% | > 20% | > 25% |
| Click-through Rate (target) | > 8% | > 10% | > 5% | > 7% |
| Win-back Rate (target) | > 5% | > 8% | > 3% | > 5% |
| Revenue Recovered (target) | - | ¥XXX/user | ¥XXX/user | - |

### 6.4 Win-back Tracking SQL

```sql
-- Win-back Campaign Effectiveness
WITH winback AS (
  SELECT
    w.user_id,
    w.phase,
    w.sent_at,
    w.opened_at,
    w.clicked_at,
    -- Check if user returned within 14 days of email
    CASE
      WHEN EXISTS (
        SELECT 1 FROM auth.sessions s
        WHERE s.user_id = w.user_id
          AND s.created_at > w.sent_at
          AND s.created_at <= w.sent_at + INTERVAL '14 days'
      ) THEN true
      ELSE false
    END AS returned,
    -- Check if user resubscribed
    CASE
      WHEN EXISTS (
        SELECT 1 FROM subscriptions sub
        WHERE sub.user_id = w.user_id
          AND sub.created_at > w.sent_at
          AND sub.status = 'active'
      ) THEN true
      ELSE false
    END AS resubscribed
  FROM winback_campaigns w
  WHERE w.sent_at >= NOW() - INTERVAL '90 days'
)
SELECT
  phase,
  COUNT(*) AS sent,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) AS opened,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) AS clicked,
  COUNT(*) FILTER (WHERE returned = true) AS returned,
  COUNT(*) FILTER (WHERE resubscribed = true) AS resubscribed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE returned = true) / NULLIF(COUNT(*), 0), 1) AS return_rate_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE resubscribed = true) / NULLIF(COUNT(*), 0), 1) AS resub_rate_pct
FROM winback
GROUP BY phase
ORDER BY phase;
```

---

## 7. KPI Dashboard

### 7.1 Churn Prevention KPIs

| KPI | Definition | Target | Frequency |
|-----|-----------|--------|-----------|
| Monthly Churn Rate | 月間解約ユーザー / 月初アクティブユーザー | < 5% | Monthly |
| Annual Churn Rate | 年間解約ユーザー / 年初アクティブユーザー | < 40% | Quarterly |
| Retention Success Rate | 解約フローで引き留め成功 / 解約開始 | > 25% | Monthly |
| Win-back Rate | Win-backで復帰 / 解約済みユーザー | > 5% | Monthly |
| Average Customer Lifetime | 平均利用期間（月） | > 18 months | Quarterly |
| Health Score Average | 全ユーザーの平均ヘルススコア | > 70 | Weekly |
| Critical Segment Ratio | Critical + Churning / 全ユーザー | < 20% | Weekly |

### 7.2 KPI Measurement SQL

```sql
-- Monthly Churn & Retention KPIs
WITH monthly_stats AS (
  SELECT
    DATE_TRUNC('month', d.date) AS month,
    -- Active users at start of month
    (SELECT COUNT(DISTINCT user_id)
     FROM auth.sessions
     WHERE created_at >= DATE_TRUNC('month', d.date) - INTERVAL '30 days'
       AND created_at < DATE_TRUNC('month', d.date)
    ) AS active_start,
    -- Churned during month
    (SELECT COUNT(*)
     FROM cancellations
     WHERE cancelled_at >= DATE_TRUNC('month', d.date)
       AND cancelled_at < DATE_TRUNC('month', d.date) + INTERVAL '1 month'
    ) AS churned,
    -- Saved from cancellation
    (SELECT COUNT(*)
     FROM cancellation_saves
     WHERE saved_at >= DATE_TRUNC('month', d.date)
       AND saved_at < DATE_TRUNC('month', d.date) + INTERVAL '1 month'
    ) AS saved,
    -- Won back
    (SELECT COUNT(*)
     FROM winback_conversions
     WHERE converted_at >= DATE_TRUNC('month', d.date)
       AND converted_at < DATE_TRUNC('month', d.date) + INTERVAL '1 month'
    ) AS won_back
  FROM generate_series(
    NOW() - INTERVAL '6 months',
    NOW(),
    INTERVAL '1 month'
  ) d(date)
)
SELECT
  month,
  active_start,
  churned,
  saved,
  won_back,
  ROUND(100.0 * churned / NULLIF(active_start, 0), 2) AS churn_rate_pct,
  ROUND(100.0 * saved / NULLIF(saved + churned, 0), 2) AS save_rate_pct,
  ROUND(100.0 * won_back / NULLIF(churned, 0), 2) AS winback_rate_pct
FROM monthly_stats
ORDER BY month;
```

### 7.3 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Churn Prevention Dashboard                  Period: MTD    │
│─────────────────────────────────────────────────────────────│
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Churn    │  │ Save     │  │ Win-back │  │ Health   │   │
│  │ Rate     │  │ Rate     │  │ Rate     │  │ Score    │   │
│  │ 4.2%    │  │ 28%      │  │ 6.1%     │  │ 72       │   │
│  │ -0.3% ▼ │  │ +5% ▲   │  │ +1.2% ▲ │  │ +3 ▲    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  Cancellation Reasons (Last 30d)  │  Health Distribution    │
│  ─────────────────────────────    │  ──────────────────     │
│  too-expensive   ████████  32%    │  Healthy   ████  45%    │
│  not-using       ██████    24%    │  At Risk   ███   25%    │
│  missing-feature ████      16%    │  Critical  ██    18%    │
│  competitor      ███       12%    │  Churning  █     12%    │
│  temporary       ██         8%    │                         │
│  other           ██         8%    │                         │
│                                                              │
│  Win-back Pipeline                                          │
│  ─────────────────                                          │
│  Phase 1 (30d): 45 users │ 3 returned │ 6.7% rate          │
│  Phase 2 (60d): 38 users │ 4 returned │ 10.5% rate         │
│  Phase 3 (90d): 32 users │ 1 returned │ 3.1% rate          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Implementation Checklist

### 8.1 Phase 1: Foundation (Sprint 1-2)

- [ ] Health Score計算ロジック実装
- [ ] ユーザーセグメント分類バッチ作成
- [ ] 解約フローUI実装
- [ ] 解約理由記録テーブル作成

### 8.2 Phase 2: Automation (Sprint 3-4)

- [ ] 自動リエンゲージメントメール設定
- [ ] Win-backメールテンプレート作成
- [ ] Health Scoreダッシュボード実装
- [ ] アラートルール設定

### 8.3 Phase 3: Optimization (Sprint 5+)

- [ ] A/Bテスト（オファー内容の最適化）
- [ ] 機械学習による解約予測モデル
- [ ] カスタマーサクセスワークフロー自動化
- [ ] KPIレポート自動生成

---

**Last Updated**: 2026-03-05
**Phase**: 58
**Status**: Design Complete
