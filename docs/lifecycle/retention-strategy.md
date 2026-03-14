# Phase 57: Retention Strategy

> FDC Modular Starter - Customer Lifecycle: Retention

---

## 1. Retention Metrics

### 1.1 Retention Targets

| Metric | Definition | Target | Current Baseline |
|--------|-----------|--------|-----------------|
| Day 1 Retention | 登録翌日にログイン | > 50% | 計測開始 |
| Week 1 Retention | 登録7日以内に再ログイン | > 35% | 計測開始 |
| Month 1 Retention | 登録30日以内に再ログイン | > 20% | 計測開始 |
| NRR (Net Revenue Retention) | 既存顧客からの月次収益維持率 | > 105% | 計測開始 |
| DAU/MAU Ratio | 日次/月次アクティブ比率 | > 25% | 計測開始 |
| Feature Adoption Rate | コア機能の利用率 | > 40% | 計測開始 |

### 1.2 Cohort Analysis SQL

```sql
-- Weekly Cohort Retention Analysis
WITH cohorts AS (
  SELECT
    id AS user_id,
    DATE_TRUNC('week', created_at) AS cohort_week
  FROM auth.users
  WHERE created_at >= NOW() - INTERVAL '12 weeks'
),
activity AS (
  SELECT
    user_id,
    DATE_TRUNC('week', created_at) AS activity_week
  FROM auth.sessions
  WHERE created_at >= NOW() - INTERVAL '12 weeks'
  GROUP BY user_id, DATE_TRUNC('week', created_at)
),
cohort_retention AS (
  SELECT
    c.cohort_week,
    EXTRACT(WEEK FROM a.activity_week - c.cohort_week)::INT AS weeks_after,
    COUNT(DISTINCT a.user_id) AS active_users,
    COUNT(DISTINCT c.user_id) AS cohort_size
  FROM cohorts c
  LEFT JOIN activity a ON c.user_id = a.user_id
    AND a.activity_week >= c.cohort_week
  GROUP BY c.cohort_week, weeks_after
)
SELECT
  cohort_week,
  cohort_size,
  weeks_after,
  active_users,
  ROUND(100.0 * active_users / NULLIF(cohort_size, 0), 1) AS retention_pct
FROM cohort_retention
WHERE weeks_after BETWEEN 0 AND 12
ORDER BY cohort_week, weeks_after;
```

### 1.3 Retention Curve Visualization

```
100% |*
     | *
 80% |  *
     |   *
 60% |    *
     |     * *
 40% |       * *
     |         * * *
 20% |             * * * * *
     |                     * * * * *
  0% +---+---+---+---+---+---+---+---+---+---+---+---+
     D1  D3  W1  W2  W3  W4  M2  M3  M4  M5  M6  M12
                     Time After Signup

     Target: Flatten curve at > 20% by Month 1
```

---

## 2. Hooked Model Design

### 2.1 Hook Cycle

Nir Eyal's Hooked Model をFDCに適用する。

```
         ┌──────────────┐
         │   Trigger    │
         │  (トリガー)   │
         └──────┬───────┘
                │
                v
         ┌──────────────┐
         │   Action     │
         │  (アクション) │
         └──────┬───────┘
                │
                v
         ┌──────────────┐
         │   Reward     │
         │  (報酬)      │
         └──────┬───────┘
                │
                v
         ┌──────────────┐
         │  Investment  │
         │  (投資)      │
         └──────┬───────┘
                │
                └──────> back to Trigger
```

### 2.2 Habit Loop Design Table

| Phase | FDC Implementation | Details |
|-------|-------------------|---------|
| **Trigger (External)** | 朝9時のメール通知「今日のタスク概要」 | 毎朝のルーティン化を促進 |
| **Trigger (Internal)** | 「今日やるべきことを確認したい」という欲求 | 不安・焦りがトリガー |
| **Action** | ダッシュボードを開き、タスクを確認 | 最小限の操作で価値到達（< 3タップ） |
| **Variable Reward** | タスク完了数・進捗率の更新、達成バッジ | 進捗の可視化が内的報酬 |
| **Investment** | タスク追加・リード更新・OKR進捗入力 | データ蓄積がスイッチングコスト |

### 2.3 Habit Formation Timeline

| Week | Goal | Mechanism |
|------|------|-----------|
| Week 1 | 毎日ログイン習慣 | 外部トリガー（メール通知）+ Checklist |
| Week 2 | コア機能の定期利用 | タスク・リード管理のルーティン化 |
| Week 3 | 内部トリガーの形成 | 通知なしでもログインする習慣 |
| Week 4+ | 習慣の定着 | Investment（データ蓄積）による定着 |

---

## 3. Notification Strategy

### 3.1 Notification Types

| Type | Purpose | Channel | Frequency | Opt-out |
|------|---------|---------|-----------|---------|
| **Weekly Summary** | 活動振り返り + 次週の計画促進 | Email | 毎週月曜 9:00 | Yes |
| **Action-Driven** | ユーザーアクションへの即座フィードバック | In-app | リアルタイム | No |
| **Reminder** | 放置タスク・未対応リードのリマインド | Email + Push | 週2回 | Yes |
| **Milestone** | 達成祝い・成長の可視化 | In-app + Email | 達成時 | Yes |
| **Digest** | 新機能・Tips紹介 | Email | 隔週 | Yes |

### 3.2 Weekly Summary Email Wireframe

```
┌─────────────────────────────────────────────────┐
│  FDC Weekly Summary                 2026-03-02  │
│─────────────────────────────────────────────────│
│                                                  │
│  こんにちは、{name}さん                          │
│                                                  │
│  先週のアクティビティ                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│                                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐               │
│  │  12    │ │   5    │ │  85%   │               │
│  │タスク  │ │リード  │ │ 達成率 │               │
│  │完了    │ │対応    │ │        │               │
│  └────────┘ └────────┘ └────────┘               │
│                                                  │
│  今週のフォーカス                                │
│  ─────────────────────                          │
│  ● 期限切れタスク: 3件                          │
│  ● フォロー予定リード: 2件                      │
│  ● OKR進捗: 42% → 目標まであと58%              │
│                                                  │
│  ┌──────────────────────────────┐                │
│  │   ダッシュボードを開く       │                │
│  └──────────────────────────────┘                │
│                                                  │
│  ─────────────────────────────────              │
│  通知設定 | 配信停止                             │
└─────────────────────────────────────────────────┘
```

### 3.3 Notification Timing Rules

| Condition | Notification | Timing |
|-----------|-------------|--------|
| 3日間未ログイン | "タスクが溜まっています" リマインド | 3日目 10:00 |
| 期限切れタスクあり | "期限切れタスクがあります" アラート | 期限翌日 9:00 |
| リード1週間未対応 | "リードのフォローアップ" リマインド | 7日目 10:00 |
| タスク10件完了 | "10タスク達成!" マイルストーン | 即座 |
| OKR 50%達成 | "目標の半分に到達!" | 即座 |

### 3.4 Notification Settings

| Setting | Options | Default |
|---------|---------|---------|
| Weekly Summary | ON / OFF | ON |
| Task Reminders | ON / OFF | ON |
| Lead Follow-up | ON / OFF | ON |
| Milestone Celebrations | ON / OFF | ON |
| Product Updates | ON / OFF | ON |
| Email Frequency | Daily / Weekly / Monthly | Weekly |
| Quiet Hours | Start / End time | 21:00 - 8:00 |
| Channel Preference | Email / Push / Both | Both |

---

## 4. Dormant User Re-engagement

### 4.1 User Segments

| Segment | Definition | Criteria | Population (est.) |
|---------|-----------|----------|-------------------|
| **Active** | 定期的に利用 | 過去7日以内にログイン | 40% |
| **At Risk** | 利用頻度低下 | 7-14日未ログイン | 25% |
| **Dormant** | 利用停止 | 14-30日未ログイン | 20% |
| **Churned** | 離脱済み | 30日以上未ログイン | 15% |

### 4.2 Segment Detection SQL

```sql
-- User Lifecycle Segment Classification
SELECT
  u.id,
  u.email,
  u.created_at,
  last_activity.last_seen,
  CASE
    WHEN last_activity.last_seen >= NOW() - INTERVAL '7 days'
      THEN 'active'
    WHEN last_activity.last_seen >= NOW() - INTERVAL '14 days'
      THEN 'at_risk'
    WHEN last_activity.last_seen >= NOW() - INTERVAL '30 days'
      THEN 'dormant'
    ELSE 'churned'
  END AS lifecycle_segment,
  EXTRACT(DAY FROM NOW() - last_activity.last_seen)::INT AS days_inactive
FROM auth.users u
LEFT JOIN LATERAL (
  SELECT MAX(created_at) AS last_seen
  FROM auth.sessions s
  WHERE s.user_id = u.id
) last_activity ON true
ORDER BY last_activity.last_seen DESC NULLS LAST;
```

### 4.3 Re-engagement Campaigns

| Segment | Campaign | Channel | Message | CTA | Timing |
|---------|----------|---------|---------|-----|--------|
| **At Risk** | "最近の活動" | Email | 先週の未完了タスク一覧 | "タスクを確認する" | 10日目 |
| **At Risk** | "新機能お知らせ" | Email | 最新機能のハイライト | "試してみる" | 12日目 |
| **Dormant** | "お帰りなさい" | Email | パーソナライズされた復帰促進 | "ダッシュボードへ" | 18日目 |
| **Dormant** | "特別オファー" | Email | 期間限定の割引・特典 | "今すぐ再開" | 25日目 |
| **Churned** | "近況アップデート" | Email | 新機能まとめ + 復帰特典 | "もう一度試す" | 45日目 |
| **Churned** | "フィードバック依頼" | Email | 離脱理由アンケート | "3分で回答" | 60日目 |

### 4.4 Campaign Effectiveness Measurement

```sql
-- Re-engagement Campaign Effectiveness
WITH campaigns AS (
  SELECT
    campaign_id,
    campaign_name,
    segment,
    sent_at,
    user_id
  FROM re_engagement_campaigns
  WHERE sent_at >= NOW() - INTERVAL '30 days'
),
conversions AS (
  SELECT
    c.campaign_id,
    c.campaign_name,
    c.segment,
    COUNT(DISTINCT c.user_id) AS sent_count,
    COUNT(DISTINCT CASE
      WHEN EXISTS (
        SELECT 1 FROM auth.sessions s
        WHERE s.user_id = c.user_id
          AND s.created_at > c.sent_at
          AND s.created_at <= c.sent_at + INTERVAL '7 days'
      ) THEN c.user_id
    END) AS returned_count
  FROM campaigns c
  GROUP BY c.campaign_id, c.campaign_name, c.segment
)
SELECT
  campaign_name,
  segment,
  sent_count,
  returned_count,
  ROUND(100.0 * returned_count / NULLIF(sent_count, 0), 1) AS conversion_rate_pct
FROM conversions
ORDER BY conversion_rate_pct DESC;
```

---

## 5. Retention Dashboard Design

### 5.1 Dashboard Metrics

```
┌─────────────────────────────────────────────────────────────┐
│  Retention Dashboard                       Period: Last 30d │
│─────────────────────────────────────────────────────────────│
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Day 1    │  │ Week 1   │  │ Month 1  │  │ NRR      │   │
│  │ 52%      │  │ 38%      │  │ 22%      │  │ 107%     │   │
│  │ +3% ▲   │  │ +1% ▲   │  │ -2% ▼   │  │ +5% ▲   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  Cohort Retention Heatmap                                   │
│  ──────────────────────────                                 │
│  Cohort  │ W0   │ W1   │ W2   │ W3   │ W4   │ W5+         │
│  ────────┼──────┼──────┼──────┼──────┼──────┼─────         │
│  Feb W1  │ 100% │  55% │  40% │  32% │  28% │  25%        │
│  Feb W2  │ 100% │  52% │  38% │  30% │  26% │  --         │
│  Feb W3  │ 100% │  58% │  42% │  35% │  --  │  --         │
│  Feb W4  │ 100% │  50% │  36% │  --  │  --  │  --         │
│  Mar W1  │ 100% │  54% │  --  │  --  │  --  │  --         │
│                                                              │
│  User Segments                    Re-engagement Performance  │
│  ─────────────                    ─────────────────────────  │
│  ┌─────────────────────┐         Campaign    │ Conv.Rate    │
│  │ Active    ████ 40%  │         ───────────┼──────────     │
│  │ At Risk   ███  25%  │         At Risk    │   18%         │
│  │ Dormant   ██   20%  │         Dormant    │   12%         │
│  │ Churned   █    15%  │         Churned    │    5%         │
│  └─────────────────────┘                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Alert Rules

| Metric | Warning Threshold | Critical Threshold | Action |
|--------|------------------|-------------------|--------|
| Day 1 Retention | < 45% | < 35% | オンボーディング改善 |
| Week 1 Retention | < 30% | < 20% | Aha Moment到達率確認 |
| NRR | < 100% | < 90% | アップセル/チャーン分析 |
| At Risk Segment | > 30% | > 40% | リエンゲージメント強化 |

---

## 6. Feature Engagement Tracking

### 6.1 Feature Usage Matrix

| Feature | Daily Users | Weekly Users | Monthly Users | Stickiness |
|---------|------------|-------------|--------------|------------|
| Tasks (4象限) | Target: 30% | Target: 60% | Target: 80% | High |
| Leads Management | Target: 15% | Target: 40% | Target: 65% | Medium |
| Action Maps | Target: 10% | Target: 25% | Target: 50% | Medium |
| OKR | Target: 5% | Target: 15% | Target: 40% | Low |
| Calendar Sync | Target: 20% | Target: 45% | Target: 70% | High |

### 6.2 Feature Correlation with Retention

```sql
-- Feature usage correlation with retention
SELECT
  feature_name,
  COUNT(DISTINCT user_id) AS total_users,
  COUNT(DISTINCT CASE
    WHEN retained_day30 = true THEN user_id
  END) AS retained_users,
  ROUND(100.0 * COUNT(DISTINCT CASE
    WHEN retained_day30 = true THEN user_id
  END) / NULLIF(COUNT(DISTINCT user_id), 0), 1) AS retention_rate_pct
FROM feature_usage fu
JOIN user_retention ur ON fu.user_id = ur.user_id
WHERE fu.first_used_at >= NOW() - INTERVAL '90 days'
GROUP BY feature_name
ORDER BY retention_rate_pct DESC;
```

---

**Last Updated**: 2026-03-05
**Phase**: 57
**Status**: Design Complete
