# Phase 59: Tracking Plan

> FDC Modular Starter - Analytics: Tracking Plan

---

## 1. Analytics Tool Selection

### 1.1 ツール比較

| 項目 | PostHog | Mixpanel | Amplitude | GA4 |
|------|---------|----------|-----------|-----|
| **OSS** | Yes | No | No | No |
| **セルフホスト** | Yes | No | No | No |
| **無料枠** | 100万イベント/月 | 2万MTU | 1,000万イベント/月 | 無制限（サンプリングあり） |
| **イベント分析** | 充実 | 充実 | 充実 | 基本的 |
| **ファネル分析** | Yes | Yes | Yes | Yes |
| **コホート分析** | Yes | Yes | Yes | 限定的 |
| **Feature Flags** | 組み込み | No | No | No |
| **A/Bテスト** | 組み込み | No | No | No |
| **Session Replay** | 組み込み | No | No | No |
| **ユーザー特定** | Yes | Yes | Yes | 限定的 |
| **SQLクエリ** | HogQL | JQL | SQL | BigQuery連携 |
| **GDPR準拠** | EU hosting可 | DPA対応 | DPA対応 | 懸念あり |
| **料金（有料）** | $0.00031/event | $25~/月 | $49~/月 | 無料 |
| **SDK** | JS/React/Node | JS/Node | JS/Node | JS |

### 1.2 推奨ツール: PostHog

**選定理由**:

1. **OSS + セルフホスト可能**: データ主権を確保でき、GDPR/個人情報保護法に完全準拠
2. **オールインワン**: Analytics + Feature Flags + A/B Test + Session Replay が統合
3. **無料枠が十分**: 月100万イベントはシード期のFDCに十分
4. **FDCとの相性**: Next.js SDK があり、App Router対応済み
5. **コスト効率**: Phase 61 の実験基盤もPostHogで完結

### 1.3 PostHog 導入構成

```
PostHog Cloud（初期）
  -> セルフホスト（ユーザー増加後に移行可能）

SDK: posthog-js + posthog-node
  -> クライアントサイド: posthog-js（ブラウザイベント）
  -> サーバーサイド: posthog-node（API/Webhook イベント）
```

---

## 2. Event Naming Conventions

### 2.1 命名規則

| ルール | 内容 | 例 |
|--------|------|----|
| **形式** | snake_case | `page_viewed`, `task_created` |
| **動詞+名詞** | verb_noun フォーマット | `button_clicked`, `form_submitted` |
| **時制** | 過去形（完了イベント） | `signup_completed`（`signup_complete` ではない） |
| **プレフィックス** | 機能ドメインを付与（任意） | `crm_lead_created`, `billing_subscription_started` |
| **大文字禁止** | すべて小文字 | `page_viewed`（`Page_Viewed` ではない） |
| **略語禁止** | 正式名称を使用 | `subscription_cancelled`（`sub_cancelled` ではない） |
| **数値接尾辞禁止** | バージョン番号を含めない | `task_created`（`task_created_v2` ではない） |

### 2.2 プロパティ命名規則

| ルール | 内容 | 例 |
|--------|------|----|
| **形式** | snake_case | `page_name`, `button_label` |
| **型明示** | ブール値は `is_` / `has_` プレフィックス | `is_demo_user`, `has_workspace` |
| **ID参照** | `_id` サフィックス | `workspace_id`, `task_id` |
| **カウント** | `_count` サフィックス | `member_count`, `task_count` |

---

## 3. Event Catalog

### 3.1 Page Views

| イベント名 | 説明 | プロパティ |
|-----------|------|-----------|
| `page_viewed` | ページ表示 | `page_name`, `page_path`, `referrer`, `workspace_id` |

### 3.2 User Actions（汎用）

| イベント名 | 説明 | プロパティ |
|-----------|------|-----------|
| `button_clicked` | ボタンクリック | `button_label`, `button_location`, `page_name` |
| `form_submitted` | フォーム送信 | `form_name`, `form_fields_count`, `page_name` |
| `search_performed` | 検索実行 | `search_query_length`, `search_results_count`, `search_context` |
| `modal_opened` | モーダル表示 | `modal_name`, `trigger_action` |
| `modal_closed` | モーダル閉じ | `modal_name`, `close_method` |
| `tab_switched` | タブ切り替え | `tab_name`, `previous_tab`, `page_name` |
| `filter_applied` | フィルター適用 | `filter_type`, `filter_value`, `page_name` |
| `sort_applied` | ソート適用 | `sort_field`, `sort_direction`, `page_name` |
| `export_requested` | データエクスポート | `export_format`, `export_type`, `record_count` |

### 3.3 Task Management

| イベント名 | 説明 | プロパティ |
|-----------|------|-----------|
| `task_created` | タスク作成 | `quadrant`, `has_due_date`, `workspace_id` |
| `task_updated` | タスク更新 | `updated_fields[]`, `quadrant`, `workspace_id` |
| `task_deleted` | タスク削除 | `quadrant`, `task_age_days`, `workspace_id` |
| `task_completed` | タスク完了 | `quadrant`, `completion_time_hours`, `workspace_id` |
| `task_moved` | タスク移動（DnD） | `from_quadrant`, `to_quadrant`, `workspace_id` |
| `task_synced` | Google Tasks同期 | `sync_direction`, `sync_count`, `workspace_id` |

### 3.4 CRM

| イベント名 | 説明 | プロパティ |
|-----------|------|-----------|
| `lead_created` | リード作成 | `source`, `funnel_stage`, `workspace_id` |
| `lead_updated` | リード更新 | `updated_fields[]`, `funnel_stage`, `workspace_id` |
| `lead_stage_changed` | ファネル段階変更 | `from_stage`, `to_stage`, `workspace_id` |
| `lead_converted` | リード転換（クライアントへ） | `conversion_time_days`, `workspace_id` |
| `lead_lost` | リード失注 | `loss_reason`, `funnel_stage`, `workspace_id` |
| `client_created` | クライアント作成 | `source`, `workspace_id` |
| `client_updated` | クライアント更新 | `updated_fields[]`, `workspace_id` |
| `approach_logged` | アプローチ記録 | `approach_type`, `lead_id`, `workspace_id` |

### 3.5 Strategy & Planning

| イベント名 | 説明 | プロパティ |
|-----------|------|-----------|
| `action_map_created` | Action Map 作成 | `workspace_id` |
| `action_map_updated` | Action Map 更新 | `updated_fields[]`, `workspace_id` |
| `action_item_created` | ActionItem 作成 | `action_map_id`, `workspace_id` |
| `action_item_completed` | ActionItem 完了 | `completion_time_days`, `workspace_id` |
| `okr_created` | Objective 作成 | `key_results_count`, `workspace_id` |
| `okr_updated` | Objective 更新 | `progress_percentage`, `workspace_id` |
| `key_result_updated` | Key Result 更新 | `progress_percentage`, `objective_id`, `workspace_id` |
| `brand_created` | ブランド戦略作成 | `workspace_id` |
| `brand_updated` | ブランド戦略更新 | `updated_sections[]`, `workspace_id` |
| `canvas_created` | Lean Canvas 作成 | `workspace_id` |
| `canvas_updated` | Lean Canvas 更新 | `updated_blocks[]`, `workspace_id` |
| `mvv_created` | MVV 作成 | `workspace_id` |
| `mvv_updated` | MVV 更新 | `updated_sections[]`, `workspace_id` |

### 3.6 Google Integration

| イベント名 | 説明 | プロパティ |
|-----------|------|-----------|
| `google_connected` | Google アカウント連携 | `scopes[]` |
| `google_disconnected` | Google アカウント連携解除 | `reason` |
| `calendar_synced` | Calendar 同期実行 | `events_count`, `sync_duration_ms` |
| `calendar_event_imported` | Calendar 予定取り込み | `event_type` |

### 3.7 Workspace & Admin

| イベント名 | 説明 | プロパティ |
|-----------|------|-----------|
| `workspace_created` | ワークスペース作成 | `workspace_id` |
| `workspace_switched` | ワークスペース切り替え | `from_workspace_id`, `to_workspace_id` |
| `member_invited` | メンバー招待 | `role`, `workspace_id` |
| `member_role_changed` | ロール変更 | `from_role`, `to_role`, `workspace_id` |
| `member_removed` | メンバー削除 | `role`, `workspace_id` |
| `invitation_accepted` | 招待受諾 | `workspace_id` |
| `invitation_declined` | 招待辞退 | `workspace_id` |

### 3.8 Conversion & Billing

| イベント名 | 説明 | プロパティ |
|-----------|------|-----------|
| `signup_started` | サインアップ開始 | `signup_method`, `referrer` |
| `signup_completed` | サインアップ完了 | `signup_method`, `time_to_complete_seconds` |
| `onboarding_step_completed` | オンボーディングステップ完了 | `step_number`, `step_name`, `time_spent_seconds` |
| `onboarding_completed` | オンボーディング全完了 | `total_time_seconds`, `steps_completed` |
| `subscription_started` | サブスクリプション開始 | `plan`, `billing_period`, `price` |
| `subscription_upgraded` | プランアップグレード | `from_plan`, `to_plan`, `price_difference` |
| `subscription_downgraded` | プランダウングレード | `from_plan`, `to_plan`, `price_difference` |
| `subscription_cancelled` | サブスクリプション解約 | `plan`, `cancellation_reason`, `tenure_months` |
| `subscription_reactivated` | サブスクリプション再開 | `plan`, `inactive_days` |
| `checkout_started` | チェックアウト開始 | `plan`, `billing_period` |
| `checkout_completed` | チェックアウト完了 | `plan`, `billing_period`, `price` |
| `checkout_abandoned` | チェックアウト離脱 | `plan`, `abandonment_step` |

### 3.9 Error & Performance

| イベント名 | 説明 | プロパティ |
|-----------|------|-----------|
| `error_occurred` | エラー発生 | `error_type`, `error_message`, `page_name`, `stack_trace` |
| `api_call_failed` | API呼び出し失敗 | `endpoint`, `status_code`, `error_message`, `duration_ms` |
| `page_load_slow` | ページ読み込み遅延 | `page_name`, `load_time_ms`, `threshold_ms` |
| `offline_detected` | オフライン検知 | `page_name`, `pending_actions_count` |
| `online_restored` | オンライン復帰 | `offline_duration_seconds`, `synced_actions_count` |

---

## 4. User Attributes

### 4.1 ユーザープロパティ

| プロパティ | 型 | 説明 | 設定タイミング |
|-----------|-----|------|---------------|
| `plan` | string | 現在のプラン（free/pro/enterprise） | サインアップ時 + プラン変更時 |
| `signup_date` | datetime | サインアップ日 | サインアップ完了時 |
| `signup_method` | string | サインアップ方法（google/demo） | サインアップ完了時 |
| `company_size` | string | 企業規模（1-5/6-20/21-100/101+） | オンボーディング時 |
| `role` | string | ワークスペースロール（owner/admin/member） | ワークスペース参加時 |
| `workspace_count` | number | 所属ワークスペース数 | ワークスペース作成/参加時 |
| `is_demo_user` | boolean | デモユーザーかどうか | ログイン時 |
| `last_active_at` | datetime | 最終アクティブ日時 | セッション開始時 |
| `total_tasks` | number | 累計タスク数 | タスク作成/削除時 |
| `total_leads` | number | 累計リード数 | リード作成/削除時 |
| `features_used` | string[] | 使用した機能一覧 | 各機能初回利用時 |
| `onboarding_completed` | boolean | オンボーディング完了フラグ | オンボーディング完了時 |
| `google_connected` | boolean | Google連携済みフラグ | Google連携時 |
| `billing_status` | string | 課金状態（active/past_due/cancelled） | 課金状態変更時 |

### 4.2 グループプロパティ（Workspace）

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `workspace_name` | string | ワークスペース名 |
| `member_count` | number | メンバー数 |
| `plan` | string | ワークスペースのプラン |
| `created_at` | datetime | ワークスペース作成日 |
| `industry` | string | 業種（任意） |

---

## 5. Privacy Compliance

### 5.1 同意管理

```
Cookie Consent Flow:
  1. 初回訪問 -> Cookie同意バナー表示
  2. ユーザーが選択:
     - 「すべて許可」-> Analytics + Marketing cookie 有効
     - 「必要最小限」-> Analytics cookie 無効（機能cookieのみ）
     - 「カスタマイズ」-> 個別設定画面
  3. 同意状態を localStorage + サーバーに保存
  4. 同意取得前はトラッキングコード非実行
```

### 5.2 同意カテゴリ

| カテゴリ | 目的 | 必須 | デフォルト |
|---------|------|------|-----------|
| **Necessary** | 認証・セッション管理 | Yes | ON（変更不可） |
| **Analytics** | ユーザー行動分析 | No | OFF |
| **Marketing** | 広告・リターゲティング | No | OFF |

### 5.3 PII（個人識別情報）除外ルール

| データ種類 | 送信可否 | 代替手段 |
|-----------|---------|---------|
| メールアドレス | 送信禁止 | ハッシュ化したユーザーID |
| 氏名 | 送信禁止 | 匿名化 |
| 電話番号 | 送信禁止 | 収集しない |
| IPアドレス | 送信禁止 | PostHog側で自動マスク |
| クレジットカード情報 | 送信禁止 | 収集しない（Stripe側で管理） |
| パスワード | 送信禁止 | 収集しない |
| フリーテキスト入力 | 送信禁止 | 入力長のみ記録 |
| リード企業名 | 送信禁止 | ハッシュ化 |

### 5.4 PII除外の実装

```typescript
// PostHog初期化時にPII除外を設定
posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  // 自動キャプチャでPIIを除外
  autocapture: {
    dom_event_allowlist: ['click', 'submit'],
    element_allowlist: ['button', 'a', 'form'],
    css_selector_allowlist: ['[data-ph-capture]'],
  },
  // IPアドレスを記録しない
  ip: false,
  // セッションリプレイでPIIをマスク
  session_recording: {
    maskAllInputs: true,
    maskTextContent: true,
  },
  // プロパティのサニタイズ
  sanitize_properties: (properties) => {
    // メールアドレスパターンを除去
    const sanitized = { ...properties };
    for (const key of Object.keys(sanitized)) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].replace(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
          '[REDACTED_EMAIL]'
        );
      }
    }
    return sanitized;
  },
});
```

### 5.5 データ保持ポリシー

| データ種類 | 保持期間 | 削除方法 |
|-----------|---------|---------|
| **イベントデータ** | 24ヶ月 | 自動削除（PostHog設定） |
| **ユーザー属性** | 36ヶ月 | 自動削除 + ユーザー削除リクエスト |
| **セッションリプレイ** | 3ヶ月 | 自動削除 |
| **同意記録** | 60ヶ月 | 法的要件に基づき長期保持 |
| **集計データ** | 無期限 | 個人を特定できない集計データのみ |

### 5.6 データ削除リクエスト対応

```
ユーザーからの削除リクエストフロー:
  1. 設定画面 -> 「データ削除をリクエスト」
  2. 確認ダイアログ表示
  3. Supabase上のユーザーデータ削除
  4. PostHog API でユーザーイベント削除
     POST /api/projects/{project_id}/delete_person/
  5. 削除完了通知（30日以内に処理）
```

---

## 6. Implementation Checklist

### 6.1 基盤セットアップ

- [ ] PostHog アカウント作成（Cloud）
- [ ] プロジェクト作成 + API Key 取得
- [ ] `posthog-js` パッケージインストール
- [ ] `posthog-node` パッケージインストール（サーバーサイド用）
- [ ] 環境変数設定（`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`）
- [ ] PostHog Provider コンポーネント作成
- [ ] `app/layout.tsx` に Provider 追加

### 6.2 同意管理

- [ ] Cookie 同意バナーコンポーネント作成
- [ ] 同意状態管理フック（`useConsent`）
- [ ] 同意取得前のトラッキング抑止ロジック
- [ ] 同意設定画面（Settings ページ内）

### 6.3 イベント実装

- [ ] Page View 自動トラッキング（App Router 対応）
- [ ] ユーザー識別（`posthog.identify()`）
- [ ] グループ設定（`posthog.group()`）
- [ ] カスタムイベントヘルパー関数作成
- [ ] 各機能にイベント送信コード追加

### 6.4 ユーザー属性

- [ ] サインアップ時のユーザープロパティ設定
- [ ] プラン変更時のプロパティ更新
- [ ] ワークスペースグループプロパティ設定

### 6.5 プライバシー

- [ ] PII サニタイズフィルター実装
- [ ] Session Replay のマスキング設定
- [ ] データ削除 API エンドポイント作成
- [ ] プライバシーポリシー更新（Analytics セクション追加）

### 6.6 検証

- [ ] 開発環境でのイベント発火確認
- [ ] PostHog ダッシュボードでのイベント受信確認
- [ ] PII が含まれていないことの確認
- [ ] 同意未取得時にトラッキングが無効なことの確認
- [ ] データ保持ポリシーの設定確認

---

**Last Updated**: 2026-03-05
**Phase**: 59
**Status**: Design Complete
