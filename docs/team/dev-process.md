# 開発プロセス設計書（Phase 71）

> FDC Modular Starter におけるブランチ戦略、コードレビュー、CI/CD、ADR の設計を定義する。

---

## 1. ブランチ戦略

### 1.1 採用モデル: GitHub Flow

シンプルかつ高速なデリバリーを実現するため、**GitHub Flow** を採用する。

- `main` ブランチは常にデプロイ可能な状態を保つ
- すべての変更は Feature Branch から Pull Request を経由して `main` にマージする
- リリースブランチは設けず、`main` へのマージ = 本番デプロイとする

### 1.2 ブランチ命名規則

| プレフィックス | 用途 | 例 |
|--------------|------|-----|
| `feature/` | 新機能追加 | `feature/task-filter` |
| `fix/` | バグ修正 | `fix/login-redirect-error` |
| `chore/` | 設定変更・依存関係更新 | `chore/update-dependencies` |
| `docs/` | ドキュメント変更 | `docs/update-onboarding-guide` |

**命名ルール**:
- 小文字のケバブケース（kebab-case）を使用
- 30文字以内を目安とする
- Issue 番号がある場合は末尾に付与: `feature/task-filter-123`

### 1.3 ブランチ構成図

```
main (保護ブランチ)
  |
  +-- feature/task-filter       (機能開発)
  |     |
  |     +-- PR #12 --> main     (レビュー後マージ)
  |
  +-- fix/login-redirect-error  (バグ修正)
  |     |
  |     +-- PR #13 --> main     (レビュー後マージ)
  |
  +-- chore/update-dependencies (メンテナンス)
        |
        +-- PR #14 --> main     (レビュー後マージ)
```

### 1.4 ブランチ保護ルール（main）

| ルール | 設定値 |
|-------|--------|
| 直接プッシュ禁止 | 有効 |
| Pull Request 必須 | 有効 |
| 最低レビュー数 | 1人以上 |
| ステータスチェック必須 | 有効（type-check, lint, test, build） |
| マージ前の最新化必須 | 有効（Require branches to be up to date） |
| 管理者にも適用 | 有効（Do not allow bypassing） |
| Force Push 禁止 | 有効 |
| ブランチ削除 | マージ後自動削除 |

---

## 2. コードレビュープロセス

### 2.1 Pull Request テンプレート

`.github/pull_request_template.md` に配置する標準テンプレート:

```markdown
## 概要
<!-- この PR で何を変更したか、なぜ変更したかを簡潔に記述 -->

## 変更種別
- [ ] 新機能（feature）
- [ ] バグ修正（fix）
- [ ] リファクタリング（refactor）
- [ ] ドキュメント（docs）
- [ ] テスト（test）
- [ ] 依存関係更新（chore）
- [ ] パフォーマンス改善（perf）

## 確認事項
- [ ] `npm run build` が成功する
- [ ] `npm run type-check` が成功する
- [ ] `npm run lint` が成功する
- [ ] テストが追加/更新されている（該当する場合）
- [ ] ドキュメントが更新されている（該当する場合）
- [ ] FDC-CORE.md / CHANGELOG.md が更新されている（該当する場合）

## スクリーンショット（UI変更がある場合）
<!-- Before / After のスクリーンショットを添付 -->

## 関連 Issue
<!-- closes #123 -->
```

### 2.2 レビューチェックリスト

レビュアーは以下の観点で確認を行う:

**機能面**:
- [ ] 要件を満たしているか
- [ ] エッジケースが考慮されているか
- [ ] エラーハンドリングが適切か

**コード品質**:
- [ ] 命名が明確で一貫しているか
- [ ] 不要なコード・コメントがないか
- [ ] DRY 原則に従っているか
- [ ] TypeScript の型定義が適切か

**テスト**:
- [ ] 新規コードにテストがあるか
- [ ] テストケースが十分か
- [ ] テストが独立して実行可能か

**パフォーマンス**:
- [ ] 不要な再レンダリングがないか
- [ ] N+1 クエリが発生していないか
- [ ] 適切なキャッシュ戦略が適用されているか

**セキュリティ**:
- [ ] 入力バリデーションが適切か
- [ ] 認証・認可チェックが実装されているか
- [ ] 機密情報がハードコードされていないか

### 2.3 レビュールール

| ルール | 内容 |
|-------|------|
| 必要レビュアー数 | 1人以上 |
| レスポンス期限 | 24時間以内に初回レスポンス |
| 自動アサイン | CODEOWNERS ファイルに基づく自動アサイン |
| Approve 条件 | すべての Conversation が Resolved であること |
| マージ方法 | Squash and Merge（コミット履歴をクリーンに保つ） |
| マージ後 | ブランチを自動削除 |

---

## 3. CI/CD 設計

### 3.1 CI パイプライン（Pull Request 時）

```
PR 作成/更新
  |
  v
[Stage 1: Install]
  npm ci
  |
  v
[Stage 2: Type Check]    ----+
  npx tsc --noEmit            |
  |                           |  並列実行
[Stage 3: Lint]           ----+
  npm run lint                |
  |                           |
[Stage 4: Unit Test]      ----+
  npm run test
  |
  v
[Stage 5: Build]
  npm run build
  |
  v
[結果: ステータスチェックとして PR に反映]
```

### 3.2 CI パイプライン（main マージ前）

```
PR Approved
  |
  v
[E2E テスト]
  npm run test:e2e（将来実装）
  |
  v
[マージ可能]
```

### 3.3 CD パイプライン

```
[Feature Branch]
  |
  +-- PR マージ --> [Staging 環境]
  |                   |
  |                   +-- 動作確認
  |                   |
  |                   +-- 問題なし
  |
  v
[main ブランチ]
  |
  +-- 自動デプロイ --> [Production 環境（Vercel）]
```

| 環境 | トリガー | デプロイ先 |
|------|---------|-----------|
| Preview | PR 作成/更新 | Vercel Preview |
| Staging | test ブランチへのマージ | Vercel Preview（staging） |
| Production | main ブランチへのマージ | Vercel Production |

### 3.4 必須ステータスチェック

| チェック名 | 対象 | 失敗時 |
|-----------|------|--------|
| `type-check` | TypeScript 型チェック | マージ不可 |
| `lint` | ESLint チェック | マージ不可 |
| `test` | Vitest ユニットテスト | マージ不可 |
| `build` | Next.js ビルド | マージ不可 |

---

## 4. ADR（Architecture Decision Records）

### 4.1 ADR テンプレート

```markdown
# ADR-XXX: [決定タイトル]

## ステータス
承認済 / 提案中 / 廃止

## コンテキスト
この決定が必要になった背景・課題を記述する。

## 決定
どのような決定を行ったかを記述する。

## 理由
なぜこの決定を行ったかを記述する。代替案との比較も含める。

## 影響
この決定による影響（正・負の両面）を記述する。

## 参考
関連するドキュメント、Issue、PR のリンクを記載する。
```

### 4.2 FDC 初期 ADR 一覧

#### ADR-001: Supabase の採用

| 項目 | 内容 |
|------|------|
| ステータス | 承認済 |
| コンテキスト | SaaS の認証・データベース・リアルタイム機能を統合的に提供する BaaS が必要 |
| 決定 | Supabase を採用する |
| 理由 | PostgreSQL ベース、Auth/Storage/Realtime 統合、OSS、無料枠あり。Firebase と比較して SQL の柔軟性とデータポータビリティが優れる |
| 影響 | Supabase のエコシステムに依存するが、標準 PostgreSQL のためロックイン度は低い |

#### ADR-002: Next.js App Router の採用

| 項目 | 内容 |
|------|------|
| ステータス | 承認済 |
| コンテキスト | React ベースのフルスタックフレームワークの選定 |
| 決定 | Next.js App Router を採用する |
| 理由 | Server Components による初期表示高速化、App Router のレイアウトシステム、Vercel との統合。Pages Router と比較してストリーミング・部分レンダリングが可能 |
| 影響 | App Router 固有の制約（クライアント/サーバーコンポーネントの区別）への対応が必要 |

#### ADR-003: サーバーサイド認証（RLS 非依存）の採用

| 項目 | 内容 |
|------|------|
| ステータス | 承認済 |
| コンテキスト | データアクセス制御を RLS（Row Level Security）のみに依存するか、サーバーサイドでも制御するかの選択 |
| 決定 | サーバーサイドで認証・認可チェックを行い、RLS は追加の防御層として使用する |
| 理由 | テスト容易性（RLS ポリシーのテストは困難）、デバッグ容易性（エラー原因の特定が容易）、柔軟性（複雑な権限ロジックをコードで表現可能） |
| 影響 | RLS のみの場合と比較してコード量は増えるが、テスト・デバッグが容易になり、セキュリティの深層防御が実現する |

---

## 5. GitHub 設定ガイド

### 5.1 ブランチ保護の設定（GitHub UI）

1. リポジトリの **Settings** > **Branches** に移動
2. **Branch protection rules** > **Add rule** をクリック
3. Branch name pattern に `main` を入力
4. 以下を有効にする:
   - **Require a pull request before merging**
     - Required approving reviews: `1`
   - **Require status checks to pass before merging**
     - Required checks: `type-check`, `lint`, `test`, `build`
     - **Require branches to be up to date before merging** にチェック
   - **Do not allow bypassing the above settings**
   - **Restrict deletions**
5. **Save changes** をクリック

### 5.2 Pull Request テンプレートの設定

1. `.github/pull_request_template.md` を作成（本フェーズで実施済み）
2. リポジトリにプッシュすると自動的に PR 作成時にテンプレートが表示される
3. 複数テンプレートが必要な場合は `.github/PULL_REQUEST_TEMPLATE/` ディレクトリを使用

### 5.3 自動マージ設定

1. **Settings** > **General** > **Pull Requests** に移動
2. 以下を設定:
   - **Allow squash merging**: 有効（デフォルトのマージ方法）
   - **Allow merge commits**: 無効
   - **Allow rebase merging**: 無効
   - **Automatically delete head branches**: 有効

---

## 6. 実装チェックリスト

- [ ] `.github/pull_request_template.md` の作成
- [ ] GitHub ブランチ保護ルールの設定
- [ ] CODEOWNERS ファイルの作成
- [ ] CI ワークフローへのステータスチェック追加
- [ ] マージ方法の設定（Squash and Merge のみ）
- [ ] 自動ブランチ削除の有効化
- [ ] ADR ディレクトリの作成（`docs/adr/`）
- [ ] 初期 ADR（001-003）の個別ファイル作成
- [ ] チームメンバーへのプロセス共有

---

**Last Updated**: 2026-03-05
**Phase**: 71
**Status**: 設計完了
