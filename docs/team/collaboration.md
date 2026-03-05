# チームコラボレーション設計書（Phase 72）

> FDC Modular Starter におけるマルチテナント設計、RBAC、招待フロー、アクティビティログの設計を定義する。

---

## 1. マルチテナント設計

### 1.1 採用モデル: 行レベル分離（workspace_id）

| 分離方式 | 採用 | 理由 |
|---------|------|------|
| DB 分離（テナントごとにDB） | 不採用 | コスト・管理負荷が高い。小〜中規模 SaaS には過剰 |
| スキーマ分離（テナントごとにスキーマ） | 不採用 | マイグレーション管理が複雑。Supabase との相性が悪い |
| **行レベル分離（workspace_id）** | **採用** | シンプル、コスト効率、Supabase RLS と親和性が高い |

### 1.2 データモデル: workspace_id カラム

すべてのビジネスデータテーブルに `workspace_id` を付与し、テナント分離を実現する。

| テーブル名 | workspace_id | 用途 |
|-----------|:---:|------|
| `workspaces` | PK | ワークスペース管理 |
| `workspace_members` | FK | メンバーシップ管理 |
| `tasks` | FK | タスク管理 |
| `brands` | FK | ブランド戦略 |
| `lean_canvas` | FK | Lean Canvas |
| `mvv` | FK | MVV（Mission/Vision/Value） |
| `objectives` | FK | OKR Objectives |
| `key_results` | FK | OKR Key Results |
| `leads` | FK | リード管理 |
| `clients` | FK | クライアント管理 |
| `approaches` | FK | アプローチ履歴 |
| `action_maps` | FK | Action Map |
| `audit_logs` | FK | 監査ログ |
| `invitations` | FK | 招待管理 |

### 1.3 テナント分離ルール

```
[リクエスト]
  |
  v
[認証チェック] -- ユーザー認証
  |
  v
[ワークスペース特定] -- workspace_id をセッションから取得
  |
  v
[データアクセス] -- WHERE workspace_id = :workspace_id を常に付与
  |
  v
[RLS（追加防御）] -- Supabase RLS ポリシーで二重チェック
```

**必須ルール**:
- すべてのデータクエリに `workspace_id` 条件を含める
- API Route では `getCurrentWorkspace()` を使用してワークスペースを特定する
- Service Layer でもワークスペース ID の検証を行う
- RLS ポリシーは最終防衛線として機能する（コードのバグがあっても他テナントのデータは漏洩しない）
- ワークスペース間のデータ参照は一切許可しない

---

## 2. RBAC（ロールベースアクセス制御）設計

### 2.1 ロール定義

| ロール | 説明 | 想定ユーザー |
|-------|------|------------|
| **OWNER** | ワークスペースの全権限。削除・譲渡が可能 | ワークスペース作成者 |
| **ADMIN** | メンバー管理・設定変更が可能。ワークスペース削除は不可 | 管理者として任命されたメンバー |
| **MEMBER** | 通常の業務操作（CRUD）が可能。管理操作は不可 | 一般チームメンバー |
| **VIEWER** | 読み取り専用。データの変更は不可 | 閲覧のみが必要な外部関係者 |

### 2.2 権限マトリクス

| 操作 | OWNER | ADMIN | MEMBER | VIEWER |
|------|:-----:|:-----:|:------:|:------:|
| タスク閲覧 | o | o | o | o |
| タスク作成 | o | o | o | x |
| タスク編集（自分の） | o | o | o | x |
| タスク編集（他者の） | o | o | x | x |
| タスク削除 | o | o | o（自分の） | x |
| ブランド閲覧 | o | o | o | o |
| ブランド作成/編集 | o | o | o | x |
| ブランド削除 | o | o | x | x |
| メンバー招待 | o | o | x | x |
| メンバー削除 | o | o | x | x |
| ロール変更 | o | o（MEMBER以下） | x | x |
| ワークスペース設定変更 | o | o | x | x |
| ワークスペース削除 | o | x | x | x |
| オーナー権限譲渡 | o | x | x | x |
| 監査ログ閲覧 | o | o | x | x |

### 2.3 権限チェックポイント

3 層で権限チェックを実施し、漏れを防止する。

```
[API Route Layer]
  |-- checkPermission(userId, workspaceId, requiredRole)
  |-- 不正アクセスは 403 Forbidden を返却
  |
  v
[Service Layer]
  |-- validateWorkspaceMembership(userId, workspaceId)
  |-- ビジネスロジック内での追加検証
  |
  v
[UI Layer]
  |-- usePermission() フックで表示/非表示を制御
  |-- ボタン・メニューの disabled 制御
  |-- 管理メニューの条件付きレンダリング
```

---

## 3. チーム招待フロー

### 3.1 招待フロー図

```
[管理者]
  |
  +-- 招待フォーム入力（メールアドレス + ロール選択）
  |
  v
[バリデーション]
  |-- メールアドレス形式チェック
  |-- 既存メンバーチェック（重複防止）
  |-- 既存招待チェック（重複防止）
  |-- 招待枠チェック（プラン上限）
  |
  v
[招待レコード作成]
  |-- invitations テーブルに INSERT
  |-- トークン生成（UUID v4）
  |-- 有効期限設定（7日間）
  |
  v
[通知]
  |-- 招待メール送信（招待リンク付き）
  |-- または招待リンクのコピー（手動共有）
  |
  v
[被招待者]
  |
  +-- 招待リンクをクリック
  |
  v
[招待受諾処理]
  |-- トークン検証（有効期限・使用済みチェック）
  |-- ユーザーアカウント確認（未登録なら新規作成）
  |-- workspace_members に INSERT
  |-- invitation ステータスを accepted に更新
  |-- 監査ログに記録
```

### 3.2 招待設定

| 項目 | 設定値 |
|------|--------|
| 有効期限 | 7日間 |
| 招待方法 | メール送信 / リンク共有 |
| ロール選択 | ADMIN / MEMBER / VIEWER（OWNER は選択不可） |
| 重複チェック | メールアドレスで既存メンバー・招待をチェック |
| 再招待 | 期限切れ招待は再送可能 |
| 招待キャンセル | 管理者がペンディング招待をキャンセル可能 |

### 3.3 招待メールテンプレート

```
件名: [FDC] {inviter_name} さんから {workspace_name} への招待

本文:
{inviter_name} さんが {workspace_name} ワークスペースに
あなたを招待しました。

ロール: {role}

以下のリンクから参加してください:
{invitation_url}

このリンクの有効期限は {expiry_date} までです。

---
FDC - Founders Direct Cockpit
```

---

## 4. アクティビティログ設計

### 4.1 ログ対象アクション

| カテゴリ | アクション | 説明 |
|---------|-----------|------|
| メンバー | `member.invited` | メンバーを招待した |
| メンバー | `member.joined` | メンバーが参加した |
| メンバー | `member.removed` | メンバーを削除した |
| メンバー | `member.role_changed` | ロールを変更した |
| タスク | `task.created` | タスクを作成した |
| タスク | `task.updated` | タスクを更新した |
| タスク | `task.deleted` | タスクを削除した |
| ブランド | `brand.created` | ブランド戦略を作成した |
| ブランド | `brand.updated` | ブランド戦略を更新した |
| ブランド | `brand.deleted` | ブランド戦略を削除した |
| 設定 | `settings.updated` | ワークスペース設定を変更した |
| 設定 | `workspace.created` | ワークスペースを作成した |
| 設定 | `workspace.deleted` | ワークスペースを削除した |

### 4.2 データ構造

```typescript
interface AuditLog {
  id: string;                  // UUID
  workspace_id: string;        // テナント ID
  action: string;              // アクション種別（例: "task.created"）
  actor_id: string;            // 実行者のユーザー ID
  target_type: string;         // 対象の種別（例: "task", "member"）
  target_id: string;           // 対象の ID
  details: Record<string, unknown>; // 追加情報（JSON）
  ip_address?: string;         // リクエスト元 IP（オプション）
  user_agent?: string;         // User-Agent（オプション）
  created_at: string;          // タイムスタンプ（ISO 8601）
}
```

### 4.3 details フィールドの例

```json
// member.role_changed
{
  "member_email": "user@example.com",
  "old_role": "MEMBER",
  "new_role": "ADMIN"
}

// task.updated
{
  "task_title": "LP デザイン作成",
  "changed_fields": ["status", "quadrant"],
  "old_values": { "status": "todo", "quadrant": 2 },
  "new_values": { "status": "in_progress", "quadrant": 1 }
}
```

### 4.4 保持期間

| 環境 | 保持期間 | 理由 |
|------|---------|------|
| 開発環境 | 7日間 | ストレージ節約。デバッグに十分 |
| 本番環境 | 90日間 | コンプライアンス要件。ストレージコストとのバランス |

**クリーンアップ**: Supabase の pg_cron を使用して定期的に古いログを削除する。

```sql
-- 90日以上前のログを削除（本番環境用）
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 5. 実装チェックリスト

- [ ] workspace_id カラムの全テーブルへの付与確認
- [ ] RLS ポリシーの設定（workspace_id ベース）
- [ ] RBAC 権限チェック関数の実装（`checkPermission`）
- [ ] usePermission フックの実装（UI 制御用）
- [ ] 招待 API の実装（作成・受諾・キャンセル）
- [ ] 招待メール送信機能の実装
- [ ] 招待リンク生成・検証ロジックの実装
- [ ] 監査ログの書き込み関数実装
- [ ] 監査ログ API の実装（一覧取得・フィルタ）
- [ ] 監査ログのクリーンアップジョブ設定
- [ ] 権限マトリクスのユニットテスト作成
- [ ] 招待フローの E2E テスト作成

---

**Last Updated**: 2026-03-05
**Phase**: 72
**Status**: 設計完了
