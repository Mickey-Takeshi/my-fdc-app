# FDC-CORE.md（v1.7 - 2026-03-05）

## 0. 位置づけ

本ドキュメントは FDC Modular Starter の
**開発・拡張に関わるすべての人間開発者とAIエージェントの起点**となる規範書である。

- すべての開発セッションは本ガイドを前提として開始する。
- 技術詳細は `docs/guides/DEVELOPMENT.md` を正とし、本ガイドはその上位コンパスとする。
- 矛盾が生じた場合は、本ガイド → DEVELOPMENT の順で整合を取る。

**現在の開発状況（2026-03-05）**:
- **バージョン**: v67.0.0
- **フロントエンド構成**: Next.js 16.0.10 + App Router + React 19.2.1
- **TypeScript**: 5.7.2（strict mode）
- **Node.js**: 22.x
- **データ永続化**: Supabase PostgreSQL
- **認証**: Supabase Auth（Google OAuth）+ デモログイン
- **マルチテナント**: ワークスペース + RBAC（OWNER/ADMIN/MEMBER）
- **CRM**: リード + クライアント + アプローチ履歴
- **タスク管理**: アイゼンハワーマトリクス（4象限）+ @dnd-kit DnD
- **施策管理**: Action Map + ActionItem + Task 紐付け + 進捗計算
- **OKR**: Objectives & Key Results + Action Map 紐付け + 進捗計算
- **Google連携**: OAuth拡張 + Calendar同期 + Tasks双方向同期
- **ビジネスツール**: Brand Strategy + Lean Canvas + MVV
- **管理機能**: Workspace Admin + Super Admin（RBAC + 招待 + 監査ログ）
- **セキュリティ**: RLS + CSP + 入力サニタイズ + レート制限
- **テスト**: Vitest + Pino ログ + GitHub Actions CI
- **PWA**: Service Worker + manifest + オフラインページ（Phase 23）
- **LP SEO**: OpenGraph メタデータ（Phase 24）
- **UI改善**: UndoSnackbar + SyncStatusIndicator + useOptimistic（Phase 25）
- **運用基盤**: Dependabot + バージョン管理 + DB メンテナンス + ヘルスチェック + インシデント対応（Phase 26-28）
- **DevEnv**: 環境セットアップ + 認証トラブルシューティング + Claude MAX マルチアカウント + CI/CD（Phase 29-31）
- **アーキテクチャ**: コマンドパターン + 設計レビューチェックリスト + 状態管理ガイド
- **パフォーマンス**: クエリ最適化 + ページネーション + キャッシュ戦略（Phase 35-37）
- **コード品質**: 孤立ファイル整理 + デバッグガイド + コードレビューガイド（Phase 38-40）
- **セキュリティ強化**: 脆弱性対応ガイド + 災害復旧計画 + 認証・認可の深掘り（Phase 41-43）
- **ドキュメント整備**: ドキュメントガイド + Next.js 16 移行ガイド + 運用ドキュメント（Phase 44-46）
- **課金基盤**: Stripe SDK + Checkout/Webhook/Portal API + プラン定義 + Feature Gate（Phase 47-49）
- **OAuth認可**: 同意画面設定ガイド + プライバシーポリシー + 利用規約 + 審査申請ガイド（Phase 50-52）
- **プロダクト戦略**: PMF検証 + バリュープロポジション + 競合分析 + ターゲットセグメント（Phase 53）
- **ロードマップ**: RICE優先順位 + Now/Next/Later + リリース戦略 + 技術負債管理（Phase 54）
- **プライシング戦略**: 課金モデル + 価格テスト + アップグレード戦略（Phase 55）
- **顧客ライフサイクル**: オンボーディング + リテンション + チャーン防止（Phase 56-58）
- **アナリティクス**: トラッキングプラン + KPIダッシュボード + 実験基盤（Phase 59-61）
- **AI統合**: AI戦略 + 実装設計 + UX/安全性設計（Phase 62-64）
- **AI運用**: モニタリング + 品質管理 + インシデント対応（Phase 65-67）
- **現在のPhase**: Phase 67 完了（AI Ops: Monitoring + Quality + Incident Response）
- **次フェーズ**: Phase 68（次期機能）

---

## 1. アーキテクチャ概要

### 1.1 ディレクトリ構成

```
founders-direct-modular/
├── app/                    # Next.js App Router
│   ├── (app)/              # 認証済みユーザー用ルート
│   │   ├── dashboard/      # ダッシュボード
│   │   ├── tasks/           # タスク管理ページ（Phase 9: 4象限）
│   │   │   └── _components/ # TodoBoard/QuadrantColumn/JokerZone
│   │   ├── leads/           # リード管理ページ（Phase 6）
│   │   │   └── _components/ # カンバン/リスト/フォーム
│   │   ├── clients/         # クライアント管理ページ（Phase 7）
│   │   │   └── _components/ # 追加/詳細モーダル
│   │   ├── action-maps/      # Action Map 管理ページ（Phase 10）
│   │   │   └── _components/ # AddActionMapForm/ActionMapCard
│   │   ├── okr/              # OKR 管理ページ（Phase 11）
│   │   │   └── _components/ # AddObjectiveForm/ObjectiveCard
│   │   ├── admin/           # 管理者ページ（Phase 18-19）
│   │   │   └── _components/ # Members/Invitations/AuditLogs/SA
│   │   ├── settings/        # 設定ページ
│   │   └── layout.tsx      # 認証レイアウト（未ログイン時LP表示）
│   ├── api/                # API Routes
│   │   ├── auth/
│   │   │   └── callback/   # OAuth コールバック
│   │   ├── google/          # Google API 連携
│   │   │   ├── calendars/   # Calendar API（Phase 13）
│   │   │   └── tasks/       # Tasks API + 双方向同期（Phase 14）
│   │   ├── tasks/          # タスク CRUD API（Phase 9）
│   │   ├── action-maps/    # Action Map CRUD API（Phase 10）
│   │   ├── action-items/   # ActionItem CRUD API（Phase 10）
│   │   ├── objectives/     # Objective CRUD API（Phase 11）
│   │   ├── key-results/    # Key Result CRUD API（Phase 11）
│   │   ├── leads/          # リード CRUD API（Phase 6）
│   │   ├── clients/        # クライアント CRUD API（Phase 7）
│   │   ├── admin/          # 管理者 API（Phase 18-19）
│   │   │   ├── invitations/ # 招待 API
│   │   │   ├── audit-logs/  # 監査ログ API
│   │   │   ├── tenants/     # テナント一覧 API（SA）
│   │   │   └── metrics/     # メトリクス API（SA）
│   │   ├── billing/         # 課金 API（Phase 47）
│   │   │   ├── webhook/     # Stripe Webhook
│   │   │   └── workshop/    # Checkout / Portal
│   │   └── health/         # ヘルスチェック API（Phase 28）
│   ├── (public)/           # 公開ページ（認証不要）
│   │   ├── privacy/        # プライバシーポリシー（Phase 51）
│   │   └── terms/          # 利用規約（Phase 51）
│   ├── login/              # ログインページ（Google OAuth + デモ）
│   ├── globals.css         # グローバルスタイル
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # エントリー（LP表示）
├── components/             # UIコンポーネント
│   └── landing/            # ランディングページ ⭐NEW
│       ├── default/        # デフォルトLP（FDCデザイン）
│       │   ├── LandingPage.tsx
│       │   ├── LandingPage.module.css
│       │   ├── HeroSection.tsx
│       │   ├── FeaturesSection.tsx
│       │   ├── PricingSection.tsx
│       │   └── FAQSection.tsx
│       └── shared/         # 共通コンポーネント
│           ├── LandingHeader.tsx
│           ├── LandingFooter.tsx
│           └── ContactForm.tsx
├── lib/                    # 共通ライブラリ
│   ├── client/             # クライアント用ライブラリ
│   │   └── supabase.ts     # ブラウザ用 Supabase クライアント
│   ├── server/             # サーバー用ライブラリ
│   │   ├── supabase.ts     # Service Role 用 Supabase クライアント
│   │   ├── auth.ts         # サーバーサイド認証ヘルパー
│   │   ├── permissions.ts  # RBAC 権限チェック
│   │   ├── stripe.ts       # Stripe SDK クライアント（Phase 47）
│   │   ├── sanitize.ts     # 入力サニタイズ + レート制限（Phase 20）
│   │   └── billing/        # 課金ロジック（Phase 47-49）
│   │       ├── pricing.ts      # 価格計算ユーティリティ
│   │       ├── webhook-handlers.ts # Webhook ハンドラー
│   │       └── feature-gate.ts # 機能ゲーティング
│   ├── config/             # 設定定義
│   │   └── pricing.ts      # プラン定義・価格設定（Phase 48）
│   ├── utils/              # ユーティリティ
│   │   └── pagination.ts   # ページネーション（Phase 35）
│   ├── contexts/           # React Context
│   │   ├── AuthContext.tsx # 認証コンテキスト（logout 関数含む）
│   │   └── DataContext.tsx # データコンテキスト
│   ├── hooks/              # カスタムフック
│   └── types/              # 型定義
│       ├── index.ts
│       ├── task.ts          # Task インターフェース
│       ├── settings.ts      # Settings インターフェース
│       ├── workspace.ts     # Workspace / WorkspaceMember 型
│       ├── prospect.ts     # Prospect / LeadRow 型（Phase 6）
│       ├── client.ts       # Client / ClientRow 型（Phase 7）
│       ├── approach.ts     # Approach / ApproachRow 型（Phase 8）
│       └── billing.ts      # Billing / Subscription 型（Phase 47）
├── public/                 # 静的ファイル
│   └── images/             # LP用画像
├── docs/                   # ドキュメント
│   ├── FDC-MODULAR-GUIDE.md # インデックス
│   ├── FDC-CORE.md         # 本ファイル
│   ├── CHANGELOG.md        # 変更履歴
│   ├── guides/             # ガイド
│   │   ├── DEBUG-GUIDE.md  # デバッグ手法（Phase 39）
│   │   └── CODE-REVIEW-GUIDE.md # コードレビュー（Phase 40）
│   ├── strategy/           # プロダクト戦略（Phase 53-55）
│   ├── lifecycle/          # 顧客ライフサイクル（Phase 56-58）
│   ├── analytics/          # アナリティクス（Phase 59-61）
│   ├── ai/                 # AI統合（Phase 62-64）
│   ├── ai-ops/             # AI運用（Phase 65-67）
│   └── runbooks/           # ランブック
├── package.json
├── tsconfig.json
└── next.config.ts
```

### 1.2 レイヤー構成

```
┌─────────────────────────────────────────┐
│ UI Layer: React Components              │
│  └─ app/(app)/ 配下のページコンポーネント │
├─────────────────────────────────────────┤
│ State Layer: React Context              │
│  ├─ AuthContext（認証状態）              │
│  └─ DataContext（アプリデータ）          │
├─────────────────────────────────────────┤
│ Storage Layer: localStorage             │
│  └─ fdc_app_data（JSON形式で永続化）     │
└─────────────────────────────────────────┘
```

---

## 2. 開発理念とAIチーム体制

本プロジェクトでは、Claude Code を**開発パートナー**として扱い、
ランブック単位のタスク実行 + ドキュメント更新を必須プロセスとする。

### 2.1 運用原則

- すべての開発セッションは `docs/FDC-CORE.md` の読み込みから開始
- 機能追加はランブック（`docs/runbooks/`）に従って実行
- 作業完了後は必ずドキュメントを更新

### 2.2 ドキュメント更新ルール

| タイミング | 更新対象 |
|-----------|---------|
| 機能追加時 | CHANGELOG.md, FDC-CORE.md |
| バグ修正時 | CHANGELOG.md |
| アーキテクチャ変更時 | DEVELOPMENT.md, FDC-CORE.md |

---

## 3. 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フロントエンド | Next.js | 16.0.10 |
| UIライブラリ | React | 19.2.1 |
| 言語 | TypeScript | 5.7.2 |
| データ永続化 | localStorage + Supabase | - |
| 認証 | Supabase Auth (Google OAuth) | - |
| バリデーション | Zod | 4.3.6 |
| 決済 | Stripe | 20.x（API v2026-02-25.clover） |

---

## 4. フェーズ完了状況

| フェーズ | 状態 | 概要 |
|---------|------|------|
| Phase 0 | ✅ 完了 | スターター構築（ログイン、ダッシュボード） |
| Phase 1 | ✅ 完了 | タスクページ追加（CRUD + 統計 + 進捗バー） |
| Phase 2 | ✅ 完了 | 設定ページ追加（Profile / Export / Import / Reset） |
| Phase 3 | ✅ 完了 | Supabase セットアップ（PostgreSQL 接続基盤） |
| Phase 4 | ✅ 完了 | Supabase Auth（Google OAuth + デモログイン） |
| Phase 5 | ✅ 完了 | ワークスペース + ロール（RBAC API + useWorkspace フック） |
| Phase 6 | ✅ 完了 | リード管理（ファネル + カンバン/リスト + 検索/フィルター） |
| Phase 7 | ✅ 完了 | クライアント管理（一覧 + 追加/編集 + 失注リード表示） |
| Phase 8 | ✅ 完了 | アプローチ履歴（タイムライン + 統計 + PDCA分析） |
| Phase 9 | ✅ 完了 | Task 4象限（アイゼンハワーマトリクス + DnD + Joker） |
| Phase 10 | ✅ 完了 | Action Map（施策管理 + ActionItem + 進捗連動） |
| Phase 11 | ✅ 完了 | OKR（Objectives & Key Results + ActionMap紐付け） |
| Phase 12 | ✅ 完了 | Google Calendar/Tasks 連携（OAuth拡張 + トークン暗号化） |
| Phase 13 | ✅ 完了 | Calendar 同期（予定取得 + ダッシュボード表示 + タスク化） |
| Phase 14 | ✅ 完了 | Tasks 同期（双方向同期 + Last Write Wins） |
| Phase 15 | ✅ 完了 | Brand Strategy（10ポイントブランド戦略） |
| Phase 16 | ✅ 完了 | Lean Canvas（9ブロックモデル） |
| Phase 17 | ✅ 完了 | MVV（Mission/Vision/Value） |
| Phase 18 | ✅ 完了 | Workspace Admin（メンバー管理・招待・監査ログ） |
| Phase 19 | ✅ 完了 | Super Admin（テナント一覧・メトリクス） |
| Phase 20 | ✅ 完了 | Security（RLS + CSP + サニタイズ + レート制限） |
| Phase 21 | ✅ 完了 | Test Strategy + Log Monitoring（Vitest + Pino + CI/CD） |
| Phase 22 | ✅ 完了 | Deploy + Performance（CWV + 画像最適化 + チェックリスト） |
| Phase 23 | ✅ 完了 | PWA Setup（Service Worker + manifest + offline） |
| Phase 24 | ✅ 完了 | Landing Page SEO（OpenGraph メタデータ） |
| Phase 25 | ✅ 完了 | UI Improvements（UndoSnackbar + SyncStatus + useOptimistic + Dependabot） |
| Phase 26 | ✅ 完了 | Version Management（Dependabot 強化 + TECH-STACK-VERSIONS） |
| Phase 27 | ✅ 完了 | DB Maintenance（BACKUP-DR + db-maintenance.sql） |
| Phase 28 | ✅ 完了 | Monitoring & Incident Response（Health Check API + INCIDENT-RESPONSE + vercel.json） |
| Phase 29 | ✅ 完了 | Test Environment Setup & Auth Troubleshooting（.env.example + ENVIRONMENT-SETUP + AUTH-TROUBLESHOOTING） |
| Phase 30 | ✅ 完了 | Claude MAX Multi-Account（CLAUDE-MULTI-ACCOUNT ドキュメント） |
| Phase 31 | ✅ 完了 | CI/CD（ci.yml + dependabot-auto-merge.yml） |
| Phase 32 | ✅ 完了 | UX & アーキテクチャ改善（設計レビュー9観点 + エラーメッセージ） |
| Phase 33 | ✅ 完了 | コマンドパターン（DataCommand型 + applyCommand） |
| Phase 34 | ✅ 完了 | 状態管理パターン（Server State vs Client State ガイド） |
| Phase 35 | ✅ 完了 | クエリ最適化（推奨インデックス + N+1対策 + EXPLAIN分析） |
| Phase 36 | ✅ 完了 | フロントエンドパフォーマンス（Core Web Vitals + Dynamic Import） |
| Phase 37 | ✅ 完了 | キャッシュ戦略（データ型別キャッシュ + Optimistic Update + ページネーション） |
| Phase 38 | ✅ 完了 | 重複・孤立ファイル整理 |
| Phase 39 | ✅ 完了 | デバッグ手法ガイド（HAR分析・タイムゾーン・切り分け） |
| Phase 40 | ✅ 完了 | コードレビュー・リファクタリングガイド |
| Phase 41 | ✅ 完了 | セキュリティ監視（npm audit + security-check workflow + 脆弱性対応ガイド） |
| Phase 42 | ✅ 完了 | 災害復旧計画（3層バックアップ + DR Plan テンプレート） |
| Phase 43 | ✅ 完了 | 認証・認可の深掘り（JWT + RBAC + OAuth + セキュリティヘッダー） |
| Phase 44 | ✅ 完了 | ドキュメントガイド（ランブックテンプレート + CHANGELOG書式 + 更新ルール） |
| Phase 45 | ✅ 完了 | Next.js 16 移行ガイド（proxy.ts + async params + Turbopack対応） |
| Phase 46 | ✅ 完了 | 運用ドキュメント（インシデント対応 + ポストモーテム + SLO/SLA） |
| Phase 47 | ✅ 完了 | 決済基盤（Stripe SDK + Checkout/Webhook/Portal API） |
| Phase 48 | ✅ 完了 | 価格設定（プラン定義 + 階層別課金モデル） |
| Phase 49 | ✅ 完了 | 課金状態管理（Webhookハンドラー + Feature Gate + 解約フロー） |
| Phase 50 | ✅ 完了 | OAuth同意画面設定ガイド |
| Phase 51 | ✅ 完了 | プライバシーポリシー + 利用規約ページ |
| Phase 52 | ✅ 完了 | OAuth審査申請ガイド（デモ動画 + Written explanation） |
| Phase 53 | ✅ 完了 | プロダクト戦略基礎（PMF + バリュープロポジション + 競合分析 + ターゲットセグメント） |
| Phase 54 | ✅ 完了 | ロードマップ（RICE優先順位 + Now/Next/Later + リリース戦略 + 技術負債管理） |
| Phase 55 | ✅ 完了 | プライシング戦略（課金モデル + 価格テスト + アップグレード戦略） |
| Phase 56 | ✅ 完了 | オンボーディング設計（Aha Moment + チェックリスト + Empty State） |
| Phase 57 | ✅ 完了 | リテンション施策（Hookedモデル + 通知戦略 + 再活性化） |
| Phase 58 | ✅ 完了 | チャーン防止（ヘルススコア + 解約フロー + Win-back） |
| Phase 59 | ✅ 完了 | トラッキングプラン（PostHog + イベントカタログ + プライバシー） |
| Phase 60 | ✅ 完了 | KPIダッシュボード（SaaS KPI + AARRR + 自動レポート） |
| Phase 61 | ✅ 完了 | 実験基盤（Feature Flags + A/Bテスト + 統計的有意性） |
| Phase 62 | ✅ 完了 | AI戦略（ユースケース評価 + LLMプロバイダー選定 + アーキテクチャ設計） |
| Phase 63 | ✅ 完了 | AI実装設計（ストリーミング + RAG + Structured Output + キャッシュ戦略） |
| Phase 64 | ✅ 完了 | AI UX/安全性（ローディングUX + エラーハンドリング + コンテンツフィルタリング + 倫理） |
| Phase 65 | ✅ 完了 | AIモニタリング（Usage Tracking + コストダッシュボード + アラート + 利用量制限） |
| Phase 66 | ✅ 完了 | AI品質管理（品質評価 + プロンプトバージョン管理 + A/Bテスト + フィードバックループ） |
| Phase 67 | ✅ 完了 | AIインシデント対応（フォールバック戦略 + 障害検知 + インシデント対応 + キャパシティプランニング） |

---

## 5. 開発フロー

```
1. ランブック確認: docs/runbooks/PHASEX-XXX.md を読む
2. 実装: ランブックに従ってコード実装
3. ビルド確認: npm run build が成功することを確認
4. ドキュメント更新:
   - CHANGELOG.md に変更内容を追記
   - FDC-CORE.md のフェーズ状況を更新
5. コミット: git add . && git commit
```

---

## 6. 用語集

| 用語 | 説明 |
|-----|------|
| FDC | Founders Direct Cockpit |
| Phase | 開発フェーズ（機能追加の単位） |
| Runbook | 実装手順書（コード付き） |
| Context | React Context（状態管理） |

---

**Last Updated**: 2026-03-05
**Version**: v67.0.0
**Status**: Phase 67 完了
**Maintained by**: FDC Development Team
