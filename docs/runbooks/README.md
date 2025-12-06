# FDC Modular ランブック

このディレクトリには、FDC Modular Starter に機能を追加するためのランブックが含まれています。

---

## 学習の進め方

1. **Phase 0** でスターターを構築（新規プロジェクト作成の場合）
2. `docs/FDC-CORE.md` を読んで全体像を理解
3. 各Phase のランブックを順番に実行
4. コードを理解しながら実装
5. ビルドが通ることを確認
6. **ドキュメントを更新**

---

## Phase 一覧（カリキュラム準拠）

### PART 1: Foundation（基礎）Phase 0-2 ✅ ランブック同梱

| Phase | ファイル | 内容 | 難易度 |
|-------|----------|------|--------|
| 0 | [PHASE0-STARTER-SETUP.md](PHASE0-STARTER-SETUP.md) | スターター構築 | ★☆☆ |
| 1 | [PHASE1-TASKS-PAGE.md](PHASE1-TASKS-PAGE.md) | タスク機能（CRUD, useReducer, localStorage） | ★★☆ |
| 2 | [PHASE2-SETTINGS-PAGE.md](PHASE2-SETTINGS-PAGE.md) | 設定ページ（フォーム, Export/Import） | ★★☆ |

> Phase 0-2 のランブックはこのフォルダに含まれています。そのまま実行してください。

---

### PART 2: Database Integration（DB統合）Phase 3-5 📝 ランブック生成

| Phase | 内容 | 難易度 |
|-------|------|--------|
| 3 | Supabase セットアップ | ★★★ |
| 4 | Supabase Auth（Google OAuth） | ★★★ |
| 5 | ワークスペース + ロール | ★★★ |

#### ランブック作成手順

**Step 1**: 以下のプロンプトを Claude Code に渡してください：

```
Phase 3, 4, 5 のランブックを作成して docs/runbooks/ に保存してください。

## 1. 必読ドキュメント（必ず最初に読み込むこと）

| ドキュメント | パス |
|------------|------|
| グランドガイド | docs/FDC-MODULAR-GUIDE.md |
| 開発ガイド | docs/guides/DEVELOPMENT.md |

## 2. 参照ファイル

references/ 内の以下を参照:
- API: references/api/auth/, references/api/workspaces/
- Context: references/contexts/WorkspaceDataContext.tsx
- 型: references/types/app-data.ts, references/types/database.ts

## 3. 前提条件

- Phase 1-2 完了（タスク機能、設定ページがlocalStorageで動作）
- Supabaseアカウント作成済み
- Google Cloud Consoleアカウント（Phase 4用）

## 4. 作成するもの

### Phase 3: Supabase セットアップ
1. Supabase プロジェクト作成手順
2. 環境変数設定（.env.local）
3. テーブル作成SQL（users, sessions）
4. RLS設定

### Phase 4: Supabase Auth
1. Google OAuth設定手順
2. /api/auth/* エンドポイント
3. middleware.ts
4. Googleログインボタン

### Phase 5: ワークスペース + ロール
1. workspaces, workspace_members テーブル
2. OWNER/ADMIN/MEMBER ロール
3. /api/workspaces/[id]/* API
4. WorkspaceContext

## 5. 実装ルール
- 開発ガイドのコーディング規約に従う
- TypeScript strict mode
- Zod バリデーション必須
- コードは省略せず完全版を提供
```

**Step 2**: 生成されたランブックを順番に実行

---

### PART 3: CRM（顧客管理）Phase 6-8 📝 ランブック生成

| Phase | 内容 | 難易度 |
|-------|------|--------|
| 6 | リード管理（ファネル） | ★★★ |
| 7 | クライアント管理 | ★★★ |
| 8 | アプローチ履歴 | ★★☆ |

#### ランブック作成手順

**Step 1**: 以下のプロンプトを Claude Code に渡してください：

```
Phase 6, 7, 8 のランブックを作成して docs/runbooks/ に保存してください。

## 1. 必読ドキュメント

| ドキュメント | パス |
|------------|------|
| グランドガイド | docs/FDC-MODULAR-GUIDE.md |
| 開発ガイド | docs/guides/DEVELOPMENT.md |

## 2. 参照ファイル

references/ 内の以下を参照:
- UI: references/ui/leads/, references/ui/clients/
- 型: references/types/app-data.ts（Prospect, Client, FunnelStatus等）

## 3. 前提条件

- Phase 3-5 完了（Supabase統合済み、Google OAuth動作）

## 4. 作成するもの

### Phase 6: リード管理
1. Prospect 型定義
2. ファネルステータス管理
3. /leads ページ（カンバン/リスト切替）
4. リード追加モーダル
5. フィルター・検索

### Phase 7: クライアント管理
1. Client 型定義
2. /clients ページ
3. リード→クライアント変換（Won時）
4. クライアントカード・詳細表示

### Phase 8: アプローチ履歴
1. ApproachRecord 型
2. タイムライン表示
3. アプローチ統計
4. PDCA分析

## 5. 実装ルール
- 開発ガイドのコーディング規約に従う
- コードは省略せず完全版を提供
```

---

### PART 4: 3-Layer Architecture（3層構造）Phase 9-11 📝 ランブック生成

| Phase | 内容 | 層 | 難易度 |
|-------|------|-----|--------|
| 9 | Task 4象限（Eisenhower Matrix） | 実行層 | ★★★ |
| 10 | Action Map | 戦術層 | ★★★ |
| 11 | OKR | 戦略層 | ★★★ |

#### ランブック作成手順

**Step 1**: 以下のプロンプトを Claude Code に渡してください：

```
Phase 9, 10, 11 のランブックを作成して docs/runbooks/ に保存してください。

## 1. 必読ドキュメント

| ドキュメント | パス |
|------------|------|
| グランドガイド | docs/FDC-MODULAR-GUIDE.md |
| 開発ガイド | docs/guides/DEVELOPMENT.md |

## 2. 参照ファイル

references/ 内の以下を参照:
- Phase 9: references/ui/task/, references/types/task.ts
- Phase 10: references/ui/action-map/, references/types/action-map.ts
- Phase 11: references/ui/okr/, references/types/okr.ts

## 3. 前提条件

- Phase 1-8 が完了していること
- 3層アーキテクチャの概念を理解していること

## 4. 3層構造のデータフロー

┌─────────────────────────────────────────┐
│ Phase 11: OKR（戦略層）                  │
│ Objective → KeyResult                   │
│   ↑ 進捗ロールアップ                     │
├─────────────────────────────────────────┤
│ Phase 10: Action Map（戦術層）           │
│ ActionMap → ActionItem                  │
│   ↑ 進捗ロールアップ                     │
├─────────────────────────────────────────┤
│ Phase 9: Task 4象限（実行層）            │
│ Task（♠♥♦♣）                            │
└─────────────────────────────────────────┘

## 5. 作成するもの

### Phase 9: Task 4象限
- Task 型に suit 追加（♠♥♦♣）
- Eisenhower Matrix UI
- ドラッグ&ドロップ

### Phase 10: Action Map
- ActionMap/ActionItem 型
- /action-map ページ
- Task との連携

### Phase 11: OKR
- Objective/KeyResult 型
- /okr ページ
- ActionMap連携
```

---

## 難易度の目安

| 難易度 | 説明 | 所要時間目安 |
|--------|------|-------------|
| ★☆☆ | 入門 - 基本的なファイル追加 | 15-30分 |
| ★★☆ | 中級 - 型定義・Context 拡張あり | 30-60分 |
| ★★★ | 上級 - CRUD・モーダル・バリデーション | 45-90分 |

---

## 参照ファイルの場所

ランブック生成に必要な参照ファイルは、プロジェクト内に含まれています：

```
references/
├── ui/          # UIコンポーネント（各機能別）
├── types/       # 型定義ファイル
├── contexts/    # Context（状態管理）
├── api/         # APIルート
└── styles/      # CSS
```

> これらはSaaS版の実装を参考にした参照ファイルです。

---

## Claude Code 運用プロンプト

### Phase 実行時（ランブックがある場合）

```
Phase N を実行してください。

ランブック: docs/runbooks/PHASEN-XXX.md

完了後、以下を更新してください:
1. docs/CHANGELOG.md に変更内容を追記
2. docs/FDC-CORE.md のフェーズ状況を更新
3. docs/runbooks/README.md のPhase状態を更新
4. package.json のバージョンを更新

最後に npm run build で確認してください。
```

### セッション開始時（既存プロジェクト）

```
このプロジェクトの開発を行います。

## 必読ドキュメント

| ドキュメント | パス |
|------------|------|
| グランドガイド | docs/FDC-MODULAR-GUIDE.md |
| 開発ガイド | docs/guides/DEVELOPMENT.md |
```

---

## SaaS版への移行

これらのランブックを完了すると、SaaS版（/foundersdirect）と同じ構造になります。

### Modular → SaaS 変換表

| Modular 版 | SaaS 版 | 変換内容 |
|------------|---------|---------|
| localStorage | Supabase | データ永続化 |
| 簡易認証 | Supabase Auth | Google OAuth |
| DataContext | WorkspaceDataContext | マルチテナント対応 |
| 単一テナント | マルチテナント | tenants テーブル追加 |

---

**Last Updated**: 2025-12-06
**Version**: v1.1
**Maintained by**: FDC Development Team
