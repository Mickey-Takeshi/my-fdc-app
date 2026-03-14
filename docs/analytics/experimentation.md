# Phase 61: Experimentation Design

> FDC Modular Starter - Analytics: Feature Flags & A/B Testing

---

## 1. Feature Flag Design

### 1.1 命名規則

| ルール | 説明 | 例 |
|--------|------|----|
| **形式** | kebab-case | `new-onboarding-flow` |
| **プレフィックス** | 目的別プレフィックス | `feat-`, `exp-`, `ops-`, `kill-` |
| **feat-** | 新機能の段階的リリース | `feat-ai-task-suggest` |
| **exp-** | A/Bテスト用 | `exp-pricing-page-v2` |
| **ops-** | 運用制御（メンテナンス等） | `ops-maintenance-mode` |
| **kill-** | 緊急停止スイッチ | `kill-google-sync` |

### 1.2 Feature Flag List（FDC）

| Flag名 | 種別 | 説明 | デフォルト | 対象 |
|--------|------|------|-----------|------|
| `feat-ai-task-suggest` | feat | AIによるタスク提案 | OFF | Pro以上 |
| `feat-advanced-reports` | feat | 高度なレポート機能 | OFF | Enterprise |
| `feat-bulk-import` | feat | CSVバルクインポート | OFF | Pro以上 |
| `feat-custom-fields` | feat | カスタムフィールド | OFF | Enterprise |
| `feat-api-access` | feat | REST API アクセス | OFF | Enterprise |
| `feat-team-dashboard` | feat | チームダッシュボード | OFF | Pro以上 |
| `feat-email-notifications` | feat | メール通知 | OFF | 全ユーザー |
| `feat-kanban-view` | feat | タスクカンバンビュー | OFF | 全ユーザー |
| `exp-pricing-page-v2` | exp | 価格ページ新デザイン | OFF | 50% |
| `exp-onboarding-checklist` | exp | オンボーディングチェックリスト | OFF | 50% |
| `exp-cta-copy` | exp | CTAコピーA/Bテスト | OFF | 50% |
| `exp-trial-length` | exp | トライアル期間テスト | OFF | 33% |
| `ops-maintenance-mode` | ops | メンテナンスモード | OFF | 全ユーザー |
| `ops-read-only-mode` | ops | 読み取り専用モード | OFF | 全ユーザー |
| `ops-debug-logging` | ops | デバッグログ有効化 | OFF | 内部ユーザー |
| `kill-google-sync` | kill | Google同期停止 | OFF | 全ユーザー |
| `kill-stripe-checkout` | kill | Stripe決済停止 | OFF | 全ユーザー |
| `kill-new-signups` | kill | 新規登録停止 | OFF | 全ユーザー |

### 1.3 Feature Flag Lifecycle

```
+-----------+     +-----------+     +-----------+     +-----------+
|  CREATED  | --> |  TESTING  | --> |  ROLLING  | --> |  STABLE   |
|           |     |           |     |   OUT     |     |           |
+-----------+     +-----------+     +-----------+     +-----------+
                                                            |
                                                            v
                                                      +-----------+
                                                      |  REMOVED  |
                                                      | (cleanup) |
                                                      +-----------+

Stage 1: CREATED
  - フラグ作成、デフォルト OFF
  - 実装コードにフラグチェック追加
  - 開発環境で動作確認

Stage 2: TESTING
  - ステージング環境で QA
  - 内部ユーザーに限定公開
  - パフォーマンス影響確認

Stage 3: ROLLING OUT
  - 本番環境で段階的ロールアウト
  - 10% -> 25% -> 50% -> 100%
  - メトリクス監視、異常時ロールバック

Stage 4: STABLE
  - 100% ロールアウト完了
  - 2週間の安定稼働確認
  - フラグ除去のチケット作成

Stage 5: REMOVED
  - コードからフラグチェック除去
  - PostHogからフラグ削除
  - コードレビュー + マージ
```

### 1.4 運用ルール

| ルール | 内容 |
|--------|------|
| **最大数** | アクティブフラグは30個以下を維持 |
| **有効期限** | 作成から90日以内にSTABLEまたはREMOVEDに移行 |
| **レビュー** | 月次でフラグ棚卸し（不要フラグの削除） |
| **ロールバック** | 異常検知時は即座にフラグOFFで無効化 |
| **ドキュメント** | フラグ作成時に目的・対象・期限を記録 |
| **テスト** | フラグON/OFF両方の状態でテスト必須 |
| **依存関係** | フラグ間の依存関係は禁止（独立性を維持） |

### 1.5 PostHog Feature Flag 実装

```typescript
// Feature Flag チェック（クライアントサイド）
import { useFeatureFlagEnabled } from 'posthog-js/react';

function TaskPage() {
  const showAiSuggest = useFeatureFlagEnabled('feat-ai-task-suggest');

  return (
    <div>
      <TaskList />
      {showAiSuggest && <AiTaskSuggest />}
    </div>
  );
}

// Feature Flag チェック（サーバーサイド）
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.POSTHOG_API_KEY!);

async function getFeatureFlags(userId: string) {
  const flags = await posthog.getAllFlags(userId);
  return flags;
}

// Feature Flag + プラン連動
function useFeatureAccess(flagName: string): boolean {
  const flagEnabled = useFeatureFlagEnabled(flagName);
  const { subscription } = useSubscription();

  // フラグがONかつプランが対応している場合のみ有効
  return flagEnabled && hasFeatureAccess(subscription.plan, flagName);
}
```

---

## 2. A/B Test Design

### 2.1 実験計画テンプレート

```markdown
# Experiment: [実験名]

## 概要
- **仮説**: [独立変数]を[変更内容]に変更すると、[従属変数]が[予想される変化]する。
  なぜなら[理論的根拠]だからである。
- **Primary Metric**: [主要指標]
- **Secondary Metrics**: [副次指標]
- **Anti-Metrics**: [悪化しないことを確認する指標]

## 設計
- **Type**: A/B / A/B/n / マルチバリエイト
- **Traffic Allocation**: [割合]%
- **Duration**: [予定期間]
- **Sample Size**: [必要サンプル数]
- **Audience**: [対象ユーザー]

## バリアント
| バリアント | 説明 | 配分 |
|-----------|------|------|
| Control (A) | 現行版 | 50% |
| Treatment (B) | [変更内容] | 50% |

## 成功基準
- Primary Metric が [X]% 以上改善
- Anti-Metrics が [Y]% 以上悪化しない
- 統計的有意性 p < 0.05

## 結果
- **Status**: [計画中 / 実施中 / 完了]
- **Winner**: [Control / Treatment / 引き分け]
- **Lift**: [改善率]%
- **p-value**: [p値]
- **Decision**: [採用 / 不採用 / 追加実験]
```

### 2.2 FDC 実験候補

| # | 実験名 | 仮説 | Primary Metric | 期間 |
|---|--------|------|---------------|------|
| 1 | 価格ページ新デザイン | CTAの位置とコピーを変更するとConversion Rateが向上する | Free->Pro CVR | 4週間 |
| 2 | オンボーディングチェックリスト | 進捗チェックリストを追加するとActivation Rateが向上する | Aha Moment到達率 | 3週間 |
| 3 | CTAコピーテスト | 「無料で始める」vs「今すぐ試す」でSignup Rateが変わる | Signup Rate | 2週間 |
| 4 | トライアル期間 | 7日 vs 14日 vs 30日でConversion Rateが変わる | Trial->Paid CVR | 6週間 |
| 5 | Empty State デザイン | チュートリアル付きEmpty StateがActivationを改善する | 初回タスク作成率 | 3週間 |
| 6 | メール通知頻度 | 週次ダイジェストがRetentionを改善する | Week 2 Retention | 4週間 |
| 7 | ダッシュボードレイアウト | カード型 vs リスト型でEngagementが変わる | Session Duration | 3週間 |

### 2.3 サンプルサイズ計算

```
必要サンプルサイズの計算式:

n = (Z_alpha/2 + Z_beta)^2 * (p1(1-p1) + p2(1-p2)) / (p1 - p2)^2

パラメータ:
  - alpha = 0.05 (有意水準 5%)
  - beta = 0.20 (検出力 80%)
  - Z_alpha/2 = 1.96
  - Z_beta = 0.84
  - p1 = ベースライン転換率
  - p2 = 期待転換率（MDE: Minimum Detectable Effect）

FDCの典型的なケース:
  ベースライン CVR: 5%
  MDE: +2% (5% -> 7%)
  必要サンプル: 約 1,500/群 (合計 3,000)

  ベースライン Signup Rate: 3%
  MDE: +1% (3% -> 4%)
  必要サンプル: 約 4,500/群 (合計 9,000)
```

### 2.4 サンプルサイズ早見表

| ベースライン | MDE +1pp | MDE +2pp | MDE +5pp | MDE +10pp |
|-------------|---------|---------|---------|----------|
| 1% | 15,764 | 4,146 | 726 | 200 |
| 3% | 11,220 | 3,002 | 542 | 156 |
| 5% | 7,396 | 2,010 | 376 | 114 |
| 10% | 3,444 | 978 | 200 | 68 |
| 20% | 1,230 | 380 | 92 | 38 |
| 50% | 384 | 150 | 60 | 38 |

※ 各群あたりの必要サンプル数（alpha=0.05, power=0.80）

### 2.5 実験の原則

| 原則 | 説明 |
|------|------|
| **1実験1変数** | 同時に変更する変数は1つのみ（マルチバリエイトテストを除く） |
| **十分なサンプル** | 統計的に有意な結果が出るまでサンプルを収集 |
| **早期終了禁止** | 有意な結果が出ても予定期間は継続（偽陽性防止） |
| **Novelty Effect 考慮** | 新規性バイアスを排除するため最低2週間は実施 |
| **Segment分析** | 全体結果だけでなくセグメント別の影響も確認 |
| **Anti-Metric監視** | 主要指標の改善が他の指標を悪化させていないか確認 |
| **再現性** | 重要な結果は再実験で再現性を確認 |

---

## 3. Statistical Significance Criteria

### 3.1 判定基準

| 基準 | 値 | 説明 |
|------|-----|------|
| **p-value** | < 0.05 | 帰無仮説を棄却する閾値 |
| **Confidence Level** | 95% | 信頼水準 |
| **Statistical Power** | 80% (1 - beta) | 真の効果を検出する確率 |
| **MDE** | 実験ごとに設定 | 検出したい最小効果量 |

### 3.2 多重比較補正

A/B/nテスト（3群以上）の場合、Bonferroni補正を適用:

```
補正後 alpha = alpha / 比較数

例: 3バリアントテスト（Control + 2 Treatment）
  比較数 = 2（Control vs T1, Control vs T2）
  補正後 alpha = 0.05 / 2 = 0.025
```

### 3.3 実験期間ガイドライン

| 条件 | 最小期間 | 推奨期間 |
|------|---------|---------|
| **日次変動** | 1週間（全曜日カバー） | 2週間 |
| **十分なサンプル** | サンプルサイズ到達まで | +1週間バッファ |
| **Novelty Effect** | 2週間 | 3-4週間 |
| **季節性** | 季節変動サイクル1回分 | - |
| **最大期間** | - | 8週間（長すぎる実験は設計を見直す） |

### 3.4 結果判定フロー

```
実験終了
  |
  v
サンプルサイズ >= 必要数?
  |-- No --> 期間延長 or 設計見直し
  |-- Yes
  v
p-value < 0.05?
  |-- No --> 統計的に有意差なし
  |           -> 効果量が小さい可能性
  |           -> 判断: 現行維持 or 追加実験
  |-- Yes
  v
Anti-Metric 悪化なし?
  |-- No --> 効果とコストのトレードオフ分析
  |           -> 判断: 不採用 or 設計修正
  |-- Yes
  v
Treatment 採用
  -> 100% ロールアウト
  -> Feature Flag 更新
  -> 結果をドキュメント化
```

---

## 4. Experiment Log Template

### 4.1 実験ログ

| # | 実験名 | 開始日 | 終了日 | Primary Metric | ベースライン | 結果 | Lift | p-value | 判定 |
|---|--------|--------|--------|---------------|-------------|------|------|---------|------|
| 001 | - | - | - | - | - | - | - | - | - |

### 4.2 実験詳細テンプレート

```markdown
## Experiment #001: [実験名]

### 基本情報
- **Flag**: `exp-[flag-name]`
- **期間**: YYYY-MM-DD ~ YYYY-MM-DD
- **担当者**: [名前]
- **ステータス**: [計画中 / 実施中 / 分析中 / 完了]

### 仮説
[独立変数]を[変更内容]に変更すると、
[従属変数]が[予想される変化]する。
なぜなら[理論的根拠]だからである。

### 設計
- **バリアント**: Control (50%) / Treatment (50%)
- **対象**: [対象ユーザーの条件]
- **除外**: [除外条件]
- **必要サンプル**: [X]/群
- **予定期間**: [X]週間

### メトリクス
| 指標 | 種類 | ベースライン | 目標 |
|------|------|-------------|------|
| [Primary] | Primary | X% | X+Y% |
| [Secondary] | Secondary | X | X+Z |
| [Anti-Metric] | Anti | X% | >= X-1% |

### 結果
| 指標 | Control | Treatment | Lift | p-value | 有意 |
|------|---------|-----------|------|---------|------|
| [Primary] | X% | Y% | +Z% | 0.0XX | Yes/No |
| [Secondary] | X | Y | +Z | 0.0XX | Yes/No |
| [Anti-Metric] | X% | Y% | Z% | 0.0XX | - |

### セグメント別結果
| セグメント | Control | Treatment | Lift | 有意 |
|-----------|---------|-----------|------|------|
| Free ユーザー | X% | Y% | +Z% | Yes/No |
| Pro ユーザー | X% | Y% | +Z% | Yes/No |
| 新規ユーザー | X% | Y% | +Z% | Yes/No |
| 既存ユーザー | X% | Y% | +Z% | Yes/No |

### 考察
- [結果の解釈]
- [予想との差異]
- [次のアクション]

### 判定
- **Winner**: [Control / Treatment]
- **Decision**: [採用 / 不採用 / 追加実験]
- **Next Steps**: [具体的なアクション]
```

---

## 5. Experiment Culture

### 5.1 実験プロセス

```
+------------+    +------------+    +------------+    +------------+
|  1. IDEATE |    | 2. DESIGN  |    | 3. EXECUTE |    | 4. LEARN   |
|            |--->|            |--->|            |--->|            |
| 仮説立案    |    | 実験設計    |    | 実装+実行   |    | 分析+共有   |
+------------+    +------------+    +------------+    +------------+
      ^                                                     |
      |                                                     |
      +-----------------------------------------------------+
                        継続的学習ループ
```

#### Stage 1: IDEATE（仮説立案）

- データ分析から改善機会を発見
- ユーザーフィードバックから仮説を生成
- 競合分析から着想を得る
- チーム全員が仮説を提案可能

#### Stage 2: DESIGN（実験設計）

- 仮説を検証可能な実験に変換
- サンプルサイズと期間を計算
- メトリクスとAnti-Metricを定義
- レビュー（実験設計レビュー会）

#### Stage 3: EXECUTE（実装+実行）

- Feature Flag で実験実装
- QA（フラグON/OFF両方）
- 本番環境でロールアウト
- メトリクス監視（異常時は即停止）

#### Stage 4: LEARN（分析+共有）

- 統計的分析
- セグメント別分析
- 結果の全社共有（実験レビュー会）
- ナレッジベースに記録

### 5.2 定期イベント

| イベント | 頻度 | 参加者 | 目的 |
|---------|------|--------|------|
| **Experiment Pitch** | 隔週（火曜） | プロダクトチーム | 新規実験の提案とレビュー |
| **Experiment Review** | 隔週（金曜） | 全チーム | 完了実験の結果共有と学び |
| **Monthly Retro** | 月次 | プロダクトチーム | 実験プロセスの振り返りと改善 |
| **Quarterly Planning** | 四半期 | 経営+プロダクト | 実験ロードマップの策定 |

### 5.3 実験の原則

| 原則 | 説明 |
|------|------|
| **Data > Opinion** | 意見ではなくデータに基づいて意思決定する |
| **Fail Fast** | 小さく素早く実験し、早期に学ぶ |
| **No Sacred Cows** | すべての仮定は検証対象（聖域を作らない） |
| **Share Failures** | 失敗した実験も共有する（学びの宝庫） |
| **Compound Wins** | 小さな改善の積み重ねが大きな成果を生む |
| **User First** | ユーザー体験を損なう実験は行わない |
| **Ethical Testing** | ダークパターンやユーザーを欺く実験は禁止 |

### 5.4 実験ダッシュボード

```
+================================================================+
|  Experiment Dashboard                                           |
+================================================================+
|                                                                 |
|  Active Experiments: 3    Completed (MTD): 2    Success Rate: 40%
|                                                                 |
|  +--- Active Experiments --------------------------------+      |
|  | # | Name              | Days  | Progress | Status    |      |
|  |---|-------------------|-------|----------|-----------|      |
|  | 1 | Pricing Page v2   | 12/28 | =====>   | On Track  |      |
|  | 2 | Onboarding CL     | 5/21  | ==>      | On Track  |      |
|  | 3 | CTA Copy Test     | 8/14  | ======>  | Attention |      |
|  +---+-------------------+-------+----------+-----------+      |
|                                                                 |
|  +--- Recent Results ------------------------------------+      |
|  | # | Name              | Winner    | Lift   | Action   |      |
|  |---|-------------------|-----------|--------|----------|      |
|  | 1 | Empty State v2    | Treatment | +12.3% | Adopted  |      |
|  | 2 | Email Frequency   | Control   | -2.1%  | Rejected |      |
|  +---+-------------------+-----------+--------+----------+      |
|                                                                 |
|  +--- Experiment Velocity (6M) -------------------------+      |
|  | Launched: 12  | Completed: 10 | Success: 4 (40%)     |      |
|  | Avg Duration: 21 days | Avg Lift (winners): +8.5%    |      |
|  +------------------------------------------------------+      |
|                                                                 |
+================================================================+
```

---

## 6. Implementation Checklist

### 6.1 Feature Flag 基盤

- [ ] PostHog Feature Flags 設定
- [ ] `useFeatureFlag` カスタムフック作成
- [ ] サーバーサイド Feature Flag ヘルパー作成
- [ ] Feature Flag + プラン連動ロジック
- [ ] フラグ一覧管理ページ（Admin）
- [ ] フラグ有効期限アラート

### 6.2 A/Bテスト基盤

- [ ] PostHog Experiments 設定
- [ ] 実験バリアント割り当てロジック
- [ ] 実験メトリクス自動収集
- [ ] 実験結果ダッシュボード

### 6.3 統計分析

- [ ] サンプルサイズ計算ユーティリティ
- [ ] p-value 計算関数
- [ ] 信頼区間計算関数
- [ ] 多重比較補正（Bonferroni）

### 6.4 ワークフロー

- [ ] 実験計画テンプレート（Notion/GitHub Issue）
- [ ] 実験レビューチェックリスト
- [ ] 実験ログデータベース
- [ ] 結果共有テンプレート（Slack/メール）

### 6.5 運用

- [ ] フラグ棚卸しスクリプト（月次）
- [ ] 期限切れフラグ通知
- [ ] 実験ダッシュボード作成
- [ ] 実験レビュー会セットアップ

### 6.6 検証

- [ ] Feature Flag ON/OFF切り替えテスト
- [ ] バリアント割り当ての均等性確認
- [ ] メトリクス収集の正確性テスト
- [ ] ロールバック手順の動作確認
- [ ] 複数実験の干渉がないことの確認

---

**Last Updated**: 2026-03-05
**Phase**: 61
**Status**: Design Complete
