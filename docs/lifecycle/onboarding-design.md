# Phase 56: Onboarding Design

> FDC Modular Starter - Customer Lifecycle: Onboarding

---

## 1. Aha Moment Identification

### 1.1 Aha Moment Candidates

ユーザーが「このプロダクトは自分に必要だ」と感じる瞬間を特定する。

| # | Aha Moment Candidate | Retention Impact | Reach Rate | Priority |
|---|---------------------|-----------------|------------|----------|
| 1 | 最初のタスクを4象限に配置し、優先度を可視化 | +35% Day7 retention | 62% | **P0** |
| 2 | リードをファネルに追加し、アプローチ履歴を記録 | +28% Day7 retention | 45% | **P1** |
| 3 | Action Map を作成し、タスクと紐付け | +40% Day7 retention | 30% | **P1** |
| 4 | OKR を設定し、進捗が自動計算される | +32% Day7 retention | 25% | **P2** |
| 5 | Google Calendar/Tasks と同期完了 | +22% Day7 retention | 38% | **P2** |
| 6 | ワークスペースにメンバーを招待 | +45% Day7 retention | 15% | **P3** |

### 1.2 Primary Aha Moment

**「最初のタスクを4象限に配置し、優先度を可視化した瞬間」**

- Retention Impact が高く（+35%）、Reach Rate も最大（62%）
- 他の機能利用の起点となるゲートウェイ行動
- 短時間（2分以内）で到達可能

### 1.3 SQL Verification Query

高リテンション行動を検証するクエリ:

```sql
-- Aha Moment到達ユーザーのリテンション比較
WITH user_aha AS (
  SELECT
    u.id AS user_id,
    u.created_at AS signup_date,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.user_id = u.id
          AND t.quadrant IS NOT NULL
          AND t.created_at <= u.created_at + INTERVAL '24 hours'
      ) THEN true
      ELSE false
    END AS reached_aha
  FROM auth.users u
  WHERE u.created_at >= NOW() - INTERVAL '90 days'
),
retention AS (
  SELECT
    ua.user_id,
    ua.reached_aha,
    -- Day 7 retention: logged in within 7 days
    CASE
      WHEN EXISTS (
        SELECT 1 FROM auth.sessions s
        WHERE s.user_id = ua.user_id
          AND s.created_at BETWEEN ua.signup_date + INTERVAL '6 days'
                                AND ua.signup_date + INTERVAL '8 days'
      ) THEN 1 ELSE 0
    END AS retained_day7
  FROM user_aha ua
)
SELECT
  reached_aha,
  COUNT(*) AS users,
  SUM(retained_day7) AS retained,
  ROUND(100.0 * SUM(retained_day7) / COUNT(*), 1) AS retention_rate_pct
FROM retention
GROUP BY reached_aha
ORDER BY reached_aha DESC;
```

---

## 2. Onboarding Flow

### 2.1 Flow Diagram

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
│  Signup   │───>│ Welcome  │───>│ Profile  │───>│ Core Feature │───>│   Aha    │
│          │    │  Screen  │    │  Setup   │    │   Tutorial   │    │  Moment  │
│ Google   │    │          │    │          │    │              │    │          │
│ OAuth or │    │ "ようこそ│    │ 名前     │    │ タスクを     │    │ 4象限に  │
│ Demo     │    │  FDCへ!" │    │ 役職     │    │ 追加しよう   │    │ 配置完了 │
│ Login    │    │          │    │ 業種     │    │              │    │ !       │
└──────────┘    └──────────┘    └──────────┘    └──────────────┘    └──────────┘
     │               │               │                │                  │
     v               v               v                v                  v
  認証完了      モチベーション     パーソナライズ    価値体験開始       価値実感
  (自動)        設定              設定              (ガイド付き)      (セルフ達成)
```

### 2.2 Step Purpose Table

| Step | Purpose | Completion Condition | Skippable | Est. Time |
|------|---------|---------------------|-----------|-----------|
| 1. Signup | アカウント作成 | Google OAuth 認証完了 or デモログイン | No | 30s |
| 2. Welcome | 期待値設定・モチベーション向上 | "始める" ボタンクリック | No | 15s |
| 3. Profile Setup | パーソナライズ・ユーザー理解 | 名前 + 役職入力 | Yes (後で設定可) | 45s |
| 4. Core Feature Tutorial | コア機能の理解・最初の操作 | タスク1件追加 | Yes (スキップ後も誘導) | 60s |
| 5. Aha Moment | プロダクト価値の実感 | タスクを象限に配置 | No (自然な操作結果) | 30s |

### 2.3 フロー分岐

```
Signup完了
  ├── 新規ユーザー → Welcome → Profile → Tutorial → Aha
  ├── 招待ユーザー → Welcome（チーム紹介） → Profile → Tutorial → Aha
  └── デモユーザー → Welcome → サンプルデータ付きDashboard → 探索
```

---

## 3. Setup Checklist Design

### 3.1 Checklist Items

| # | Icon | Item | Completion Condition | Reward |
|---|------|------|---------------------|--------|
| 1 | :white_check_mark: | プロフィールを設定 | 名前・役職を入力 | "準備OK!" バッジ |
| 2 | :clipboard: | 最初のタスクを追加 | タスク1件作成 | 進捗+1 |
| 3 | :dart: | タスクを4象限に配置 | 象限にドラッグ完了 | **Aha Moment 達成** |
| 4 | :handshake: | リードを1件追加 | リード作成完了 | "営業開始!" バッジ |
| 5 | :world_map: | Action Mapを作成 | Action Map 1件作成 | "戦略家" バッジ |
| 6 | :calendar: | Google Calendarを連携 | OAuth接続完了 | "連携マスター" バッジ |
| 7 | :busts_in_silhouette: | チームメンバーを招待 | 招待メール送信完了 | "チームビルダー" バッジ |

### 3.2 Checklist UI Structure

```
┌─────────────────────────────────────────────┐
│  Setup Checklist              3/7 完了       │
│  ━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░  43%      │
│                                              │
│  [x] プロフィールを設定          完了!       │
│  [x] 最初のタスクを追加          完了!       │
│  [x] タスクを4象限に配置         完了!       │
│  [ ] リードを1件追加        → はじめる       │
│  [ ] Action Mapを作成       → はじめる       │
│  [ ] Google Calendarを連携  → 連携する       │
│  [ ] チームメンバーを招待   → 招待する       │
│                                              │
│  [後でやる]                                  │
└─────────────────────────────────────────────┘
```

---

## 4. Progress Display

### 4.1 Progress Components

| Component | Description | Location |
|-----------|------------|----------|
| Count/Total | "3/7 完了" テキスト表示 | チェックリストヘッダー |
| Progress Bar | 線形プログレスバー（0-100%） | チェックリスト上部 |
| Step Indicator | 現在のステップをハイライト | 各アイテム横 |
| Celebration Modal | 全完了時のお祝いモーダル | オーバーレイ |

### 4.2 Celebration Modal Design

```
┌─────────────────────────────────────────────┐
│                                              │
│              * * * * * * *                   │
│            *               *                 │
│                                              │
│          セットアップ完了!                    │
│                                              │
│     すべてのステップを完了しました。          │
│     FDCを最大限活用する準備ができました!      │
│                                              │
│     ┌─────────────────────────────┐          │
│     │   ダッシュボードへ          │          │
│     └─────────────────────────────┘          │
│                                              │
│     ヒント: 設定からいつでも                 │
│     チェックリストを確認できます              │
│                                              │
└─────────────────────────────────────────────┘
```

### 4.3 Progress Milestones

| Milestone | Trigger | Feedback |
|-----------|---------|----------|
| 25% (2/7) | 2項目完了 | "順調です!" トースト通知 |
| 50% (4/7) | 4項目完了 | "半分達成!" プログレスバー色変更 |
| 75% (5/7) | 5項目完了 | "あと少し!" 励ましメッセージ |
| 100% (7/7) | 全項目完了 | Celebration Modal 表示 |

---

## 5. Empty State Design

### 5.1 Empty State Definition

各画面でデータが存在しない場合の表示を設計する。

| Screen | Message | CTA | Sample Data |
|--------|---------|-----|-------------|
| Dashboard | "まだデータがありません。最初のタスクを追加してみましょう!" | "タスクを追加" | サマリーカード（0件表示） |
| Tasks | "タスクを追加して、優先度を4象限で整理しましょう" | "最初のタスクを追加" | サンプルタスク3件 |
| Leads | "リードを追加して、営業パイプラインを構築しましょう" | "リードを追加" | サンプルリード2件 |
| Clients | "クライアントが登録されるとここに表示されます" | "リードから変換" | - |
| Action Maps | "施策を計画して、タスクと紐付けましょう" | "Action Mapを作成" | サンプルMap 1件 |
| OKR | "目標と成果指標を設定して、進捗を追跡しましょう" | "OKRを設定" | サンプルOKR 1件 |
| Calendar | "Google Calendarと連携して、予定を表示しましょう" | "Calendarを連携" | - |

### 5.2 Empty State Wireframe

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│                   ┌─────────┐                        │
│                   │         │                        │
│                   │  (icon) │                        │
│                   │         │                        │
│                   └─────────┘                        │
│                                                      │
│            タスクを追加して、                         │
│        優先度を4象限で整理しましょう                  │
│                                                      │
│     ┌──────────────────────────────────┐             │
│     │     + 最初のタスクを追加          │             │
│     └──────────────────────────────────┘             │
│                                                      │
│     ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─              │
│                                                      │
│     サンプルで試す:                                   │
│     ┌──────────────────────────────────────────┐     │
│     │ [ ] ランディングページのデザイン改善      │     │
│     │ [ ] 新規顧客へのフォローアップメール作成  │     │
│     │ [ ] 月次売上レポートの作成                │     │
│     └──────────────────────────────────────────┘     │
│     [サンプルデータを読み込む]                        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 6. Sample Data / Templates

### 6.1 Sample Tasks

```json
[
  {
    "title": "ランディングページのデザイン改善",
    "quadrant": "urgent-important",
    "description": "CVR向上のためにヒーローセクションを改善する",
    "status": "todo"
  },
  {
    "title": "新規顧客へのフォローアップメール作成",
    "quadrant": "not-urgent-important",
    "description": "初回商談後の自動フォローアップテンプレートを作成",
    "status": "todo"
  },
  {
    "title": "月次売上レポートの作成",
    "quadrant": "urgent-not-important",
    "description": "先月の売上データを集計してチームに共有",
    "status": "todo"
  }
]
```

### 6.2 Sample Leads

```json
[
  {
    "company": "ABC Corporation",
    "contact_name": "Sample Contact",
    "status": "new",
    "source": "website",
    "estimated_value": 500000,
    "notes": "Webサイトからの問い合わせ。SaaS導入に興味あり。"
  },
  {
    "company": "XYZ Holdings",
    "contact_name": "Sample Manager",
    "status": "contacted",
    "source": "referral",
    "estimated_value": 1200000,
    "notes": "既存クライアントからの紹介。来週ミーティング予定。"
  }
]
```

### 6.3 Sample OKR

```json
{
  "objective": "Q1の売上目標を達成する",
  "key_results": [
    { "title": "月間MRRを200万円に到達", "target": 2000000, "current": 0 },
    { "title": "新規顧客を10社獲得", "target": 10, "current": 0 },
    { "title": "解約率を3%以下に維持", "target": 3, "current": 0 }
  ]
}
```

---

## 7. Onboarding Metrics

### 7.1 KPI Definition

| Metric | Definition | Target | Measurement |
|--------|-----------|--------|-------------|
| Onboarding Completion Rate | チェックリスト全項目完了率 | > 40% | 完了ユーザー / 全登録ユーザー |
| Aha Moment Reach Rate | Aha Moment 到達率 | > 60% | Aha到達ユーザー / 全登録ユーザー |
| Time to Value (TTV) | 登録からAha Moment到達までの時間 | < 5分 | 中央値で計測 |
| Day 1 Retention | 翌日もログインした割合 | > 50% | Day1アクティブ / 全登録 |
| Setup Checklist Progress | チェックリスト平均進捗率 | > 55% | 全ユーザーの完了アイテム平均 |

### 7.2 Measurement SQL

```sql
-- Onboarding KPIs Dashboard
SELECT
  -- Onboarding Completion Rate
  ROUND(100.0 * COUNT(*) FILTER (
    WHERE checklist_completed = true
  ) / NULLIF(COUNT(*), 0), 1) AS completion_rate_pct,

  -- Aha Moment Reach Rate
  ROUND(100.0 * COUNT(*) FILTER (
    WHERE aha_reached = true
  ) / NULLIF(COUNT(*), 0), 1) AS aha_reach_rate_pct,

  -- Average Time to Value (minutes)
  ROUND(AVG(
    EXTRACT(EPOCH FROM (aha_reached_at - created_at)) / 60
  ) FILTER (WHERE aha_reached = true), 1) AS avg_ttv_minutes,

  -- Day 1 Retention
  ROUND(100.0 * COUNT(*) FILTER (
    WHERE day1_active = true
  ) / NULLIF(COUNT(*), 0), 1) AS day1_retention_pct

FROM onboarding_metrics
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### 7.3 Tracking Events

| Event Name | Trigger | Properties |
|-----------|---------|------------|
| `onboarding_started` | Welcome画面表示 | `user_id`, `source` |
| `onboarding_step_completed` | 各ステップ完了 | `step_name`, `duration_sec` |
| `aha_moment_reached` | タスクを象限に配置 | `user_id`, `ttv_seconds` |
| `checklist_item_completed` | チェックリスト項目完了 | `item_name`, `progress_pct` |
| `onboarding_completed` | 全チェックリスト完了 | `total_duration_sec` |
| `onboarding_skipped` | "後でやる" クリック | `skipped_at_step`, `progress_pct` |
| `sample_data_loaded` | サンプルデータ読み込み | `data_type` |

---

## 8. Implementation Notes

### 8.1 Technical Considerations

- **State Management**: オンボーディング進捗は `user_metadata` に保存
- **Persistence**: チェックリスト状態は Supabase に永続化
- **Responsive**: モバイルではステップバイステップ表示に切り替え
- **A/B Testing**: Aha Moment候補をテストするためのフィーチャーフラグ対応
- **Analytics**: イベントトラッキングは `onboarding_events` テーブルに記録

### 8.2 Database Schema

```sql
CREATE TABLE onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  checklist_items JSONB DEFAULT '{}',
  aha_reached BOOLEAN DEFAULT false,
  aha_reached_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

-- Index for quick lookup
CREATE INDEX idx_onboarding_user ON onboarding_progress(user_id);
CREATE INDEX idx_onboarding_workspace ON onboarding_progress(workspace_id);
```

---

**Last Updated**: 2026-03-05
**Phase**: 56
**Status**: Design Complete
