# Changelog

All notable changes to FDC Modular Starter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 予定

| Phase | 内容 |
|-------|------|
| Phase 9+ | PART-04 以降 |

---

## [8.0.0] - 2026-03-04 - Phase 8: アプローチ履歴

### 概要

リードへのアプローチ（接触）履歴の記録・分析機能を実装。タイムライン形式でアプローチ履歴を表示、種別・結果の記録、全期間/今月/今週の統計、タイプ別集計バー。リード詳細モーダルにアプローチタブを追加。

### Added

| ファイル | 内容 |
|---------|------|
| `lib/types/approach.ts` | Approach, ApproachType, ApproachResult, ApproachStats 型定義 |
| `app/api/approaches/route.ts` | アプローチ一覧取得・作成 API |
| `app/api/approaches/[id]/route.ts` | アプローチ削除 API |
| `app/(app)/leads/_components/ApproachTimeline.tsx` | タイムライン表示 + アプローチ追加フォーム |
| `app/(app)/leads/_components/ApproachStatsSection.tsx` | アプローチ統計（期間別 + タイプ別） |

### Changed

| ファイル | 内容 |
|---------|------|
| `app/(app)/leads/_components/ProspectDetailModal.tsx` | 詳細/アプローチのタブ切替追加 |
| `app/(app)/leads/page.tsx` | アプローチ統計セクション追加 |
| `app/globals.css` | タイムライン CSS を追加 |

---

## [7.0.0] - 2026-03-04 - Phase 7: クライアント管理

### 概要

リードが受注（Won）した後のクライアント（既存客）管理機能を実装。クライアント一覧テーブル、追加・編集モーダル、失注リード一覧表示。リードからクライアントへの変換時に自動でリードステータスを Won に更新。

### Added

| ファイル | 内容 |
|---------|------|
| `lib/types/client.ts` | Client, ClientStatus, ClientRow, HistoryEntry 型定義 |
| `app/api/clients/route.ts` | クライアント一覧取得・作成 API |
| `app/api/clients/[id]/route.ts` | クライアント詳細・更新・削除 API |
| `app/(app)/clients/page.tsx` | クライアント管理ページ（統計・検索・一覧・失注リード） |
| `app/(app)/clients/_components/AddClientForm.tsx` | クライアント追加モーダル |
| `app/(app)/clients/_components/ClientDetailModal.tsx` | クライアント詳細・編集モーダル |

### Changed

| ファイル | 内容 |
|---------|------|
| `app/(app)/layout.tsx` | ナビゲーションに「クライアント」タブを追加 |
| `app/globals.css` | クライアントステータスバッジ CSS を追加 |

---

## [6.0.0] - 2026-03-04 - Phase 6: リード管理

### 概要

CRM の第一歩として、リード（見込み客）管理機能を実装。ファネルステータス（新規/アプローチ中/商談中/提案中/受注/失注）によるカンバン表示、リスト表示切替、フィルター・検索機能、ドラッグ&ドロップによるステータス変更。既存の Supabase `leads` テーブルを活用し、ワークスペース単位でスコープ。

### Added

| ファイル | 内容 |
|---------|------|
| `lib/types/prospect.ts` | Prospect, ProspectStatus, LeadRow 型定義、DB 変換関数 |
| `app/api/leads/route.ts` | リード一覧取得・作成 API（ワークスペーススコープ） |
| `app/api/leads/[id]/route.ts` | リード詳細・更新・削除 API |
| `app/(app)/leads/page.tsx` | リード管理ページ（統計・ツールバー・ビュー切替） |
| `app/(app)/leads/_components/KanbanView.tsx` | カンバン表示（D&D ステータス変更） |
| `app/(app)/leads/_components/KanbanCard.tsx` | カンバンカードコンポーネント |
| `app/(app)/leads/_components/ListView.tsx` | リスト（テーブル）表示 |
| `app/(app)/leads/_components/AddProspectForm.tsx` | リード追加モーダルフォーム |
| `app/(app)/leads/_components/ProspectDetailModal.tsx` | リード詳細・編集モーダル |

### Changed

| ファイル | 内容 |
|---------|------|
| `app/(app)/layout.tsx` | ナビゲーションに「リード」タブを追加 |
| `app/globals.css` | カンバン・リード関連 CSS スタイルを追加 |

---

## [5.0.0] - 2026-03-04 - Phase 5: ワークスペース + ロール

### 概要

マルチテナント基盤を構築。ワークスペース CRUD API、メンバー招待・削除・ロール変更 API、RBAC（OWNER/ADMIN/MEMBER）権限チェック、useWorkspace フック。Zod によるリクエストバリデーション。

### Added

| ファイル | 内容 |
|---------|------|
| `lib/types/workspace.ts` | Workspace, WorkspaceMember, WorkspaceRole 型定義 |
| `lib/server/auth.ts` | サーバーサイド認証ヘルパー（Cookie からユーザー取得） |
| `lib/server/permissions.ts` | RBAC 権限チェック（OWNER > ADMIN > MEMBER） |
| `app/api/workspaces/route.ts` | ワークスペース一覧取得・作成 API |
| `app/api/workspaces/[id]/route.ts` | ワークスペース詳細・更新・削除 API |
| `app/api/workspaces/[id]/members/route.ts` | メンバー一覧・招待 API |
| `app/api/workspaces/[id]/members/[userId]/route.ts` | ロール変更・メンバー削除 API |
| `lib/hooks/useWorkspace.ts` | ワークスペース管理フック（クライアントサイド） |
| `zod` | リクエストバリデーションライブラリ |

---

## [4.0.0] - 2026-03-04 - Phase 4: Supabase Auth (Google OAuth)

### 概要

Google OAuth 認証を実装。Supabase Auth と連携し、Google アカウントでのログインを実現。既存のデモログインも併存。PKCE フローによるセキュアな認証コールバック、Cookie ベースのセッション管理、AuthContext への logout 関数追加。

### Added

| ファイル | 内容 |
|---------|------|
| `app/api/auth/callback/route.ts` | OAuth コールバックハンドラー（PKCE コード交換 + users upsert + Cookie 設定） |

### Changed

| ファイル | 内容 |
|---------|------|
| `app/login/page.tsx` | Google OAuth ボタン追加、エラーハンドリング強化、デモログインとの共存 |
| `lib/contexts/AuthContext.tsx` | `logout` 関数を Context に追加、`useAuth()` から利用可能に |
| `app/(app)/layout.tsx` | Cookie フォールバック追加（OAuth 後の localStorage 同期）、Supabase signOut 統合 |

---

## [3.0.0] - 2026-03-04 - Phase 3: Supabase セットアップ

### 概要

Supabase PostgreSQL への接続基盤を構築。クライアント/サーバー用 Supabase クライアント、環境変数設定。既存 Supabase DB（users, tasks, workspaces 等）を活用。

### Added

| ファイル | 内容 |
|---------|------|
| `lib/client/supabase.ts` | ブラウザ用 Supabase クライアント（@supabase/ssr） |
| `lib/server/supabase.ts` | サーバー用 Supabase クライアント（Service Role Key） |
| `@supabase/supabase-js` | Supabase JS ライブラリ |
| `@supabase/ssr` | Supabase SSR ヘルパー |

### Changed

| ファイル | 内容 |
|---------|------|
| `.env.local` | Supabase URL, anon key, service role key を追加 |

---

## [2.5.0] - 2026-03-04 - Phase 2: 設定ページ追加

### 概要

設定ページを追加。プロフィール編集、JSON形式のデータExport/Import、リセット機能を実装。

### Added

| ファイル | 内容 |
|---------|------|
| `lib/types/settings.ts` | Settings / ExportData インターフェース定義 |
| `app/(app)/settings/page.tsx` | 設定ページ（プロフィール編集 / Export / Import / Reset） |

### Changed

| ファイル | 内容 |
|---------|------|
| `app/(app)/layout.tsx` | ナビゲーションに設定タブを追加 |

---

## [2.4.0] - 2026-03-04 - Phase 1: タスクページ追加

### 概要

タスク管理機能を追加。useReducer + localStorage によるCRUD操作、統計表示、進捗バーを実装。

### Added

| ファイル | 内容 |
|---------|------|
| `lib/types/task.ts` | Task インターフェース定義 |
| `lib/hooks/useTaskReducer.ts` | useReducer + localStorage によるタスク状態管理 |
| `app/(app)/tasks/page.tsx` | タスク管理ページ（追加/編集/削除/完了切替/統計） |

### Changed

| ファイル | 内容 |
|---------|------|
| `app/(app)/layout.tsx` | ナビゲーションにタスクタブを追加 |

### Fixed

| 内容 |
|------|
| useTaskReducer の localStorage 競合バグを修正（useRef による初期化フラグ追加） |

---

## [2.3.0] - 2026-02-22 - Next.js 16 Migration

### 概要

Next.js 15.5.7 から Next.js 16.0.10 への移行。Workshop 教材との整合性を確保。

### Changed

| 変更 | 内容 |
|------|------|
| `middleware.ts` → `proxy.ts` | ファイル名・関数名を Next.js 16 に準拠 |
| `package.json` | next 16.0.10, eslint-config-next 16.0.10, lint: "eslint ." |
| `next.config.ts` | コメント更新 |
| 全ドキュメント | Next.js 15 表記を 16 に統一 |

### 技術スタック

| 技術 | バージョン |
|------|-----------|
| Next.js | 16.0.10 |
| React | 19.2.1 |
| TypeScript | 5.7.2 |
| Node.js | 22.x |

---

## [1.0.0] - 2025-12-06 - Phase 0: スターター構築

### 概要

foundersdirect をベースにしたミニマルスターターの初期リリース。
Next.js 16 + React 19 + TypeScript 構成で、SaaS版と同じアーキテクチャパターンを使用。

### Added

| ファイル | 内容 |
|---------|------|
| `app/layout.tsx` | ルートレイアウト |
| `app/page.tsx` | エントリーポイント（/login へリダイレクト） |
| `app/login/page.tsx` | ログインページ（デモ認証） |
| `app/(app)/layout.tsx` | 認証済みレイアウト（ヘッダー + ナビ） |
| `app/(app)/dashboard/page.tsx` | ダッシュボード（統計 + タスク管理） |
| `app/globals.css` | グローバルスタイル（SaaS版互換） |
| `lib/types/index.ts` | 型定義（User, Task, AppData） |
| `lib/contexts/AuthContext.tsx` | 認証コンテキスト |
| `lib/contexts/DataContext.tsx` | データコンテキスト（localStorage 永続化） |

### ドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/FDC-MODULAR-GUIDE.md` | メインガイド（インデックス） |
| `docs/FDC-CORE.md` | 開発コアガイド |
| `docs/CHANGELOG.md` | 本ファイル |
| `docs/guides/DEVELOPMENT.md` | 開発者・AI向け技術ガイド |
| `docs/runbooks/README.md` | ランブック一覧 |
| `docs/runbooks/PHASE1-TASKS-PAGE.md` | Phase 1 ランブック |
| `docs/runbooks/PHASE2-SETTINGS-PAGE.md` | Phase 2 ランブック |
| `docs/runbooks/PHASE3-LEADS.md` | Phase 3 ランブック |

### 技術スタック

| 技術 | バージョン |
|------|-----------|
| Next.js | 15.1.0 (当時) |
| React | 19.0.0 (当時) |
| TypeScript | 5.7.2 |
| Node.js | 22.x |

---

## 更新ルール

### 新しいエントリの追加方法

1. `[Unreleased]` セクションに変更内容を追記
2. リリース時に日付とバージョンを確定
3. 新しい `[Unreleased]` セクションを作成

### フォーマット

```markdown
## [X.Y.Z] - YYYY-MM-DD - Phase N: タイトル

### 概要
簡潔な説明

### Added
- 追加した機能/ファイル

### Changed
- 変更した機能/ファイル

### Fixed
- 修正したバグ

### Removed
- 削除した機能/ファイル
```

---

**Last Updated**: 2026-03-04
**Maintained by**: FDC Development Team
