# 監査ログ設計書（Phase 79）

> FDC Modular Starter における監査ログの記録、検索、レポート、保持ポリシーの設計を定義する。

---

## 1. 目的と要件

### 1.1 監査ログの目的

| 目的 | 説明 |
|------|------|
| セキュリティ | 不正アクセスの検知、インシデント調査の証跡確保 |
| コンプライアンス | SOC 2 / ISO 27001 認証要件への対応 |
| トラブルシューティング | 問題発生時の原因特定、操作履歴の追跡 |
| 監査対応 | 内部・外部監査への証跡提供 |

### 1.2 要件

| 要件 | 説明 | 実現方法 |
|------|------|---------|
| 完全性 | すべての重要操作を漏れなく記録 | API ミドルウェアでの自動記録 |
| 改ざん防止 | 記録済みログの改変を防止 | APPEND ONLY ポリシー + RLS |
| 検索性 | 条件指定による高速検索 | 複合インデックス + 全文検索 |
| 保持 | 規定期間のデータ保持と安全な廃棄 | 自動アーカイブ + 期限管理 |

---

## 2. ログ対象イベント

### 2.1 イベント分類

| カテゴリ | 重要度 | イベント |
|---------|--------|---------|
| 認証（Auth） | 高 | ログイン、ログアウト、パスワード変更、MFA 設定変更、ログイン失敗 |
| データ操作（Data） | 中 | 作成（Create）、読み取り（Read）、更新（Update）、削除（Delete）、エクスポート |
| 権限（Permission） | 高 | 権限付与（Grant）、権限剥奪（Revoke）、ロール変更 |
| 設定（Settings） | 高 | システム設定変更、ワークスペース設定変更 |
| 管理（Admin） | 高 | メンバー招待、メンバー削除、ワークスペース作成・削除 |

### 2.2 アクション定義一覧

| アクション | カテゴリ | 重要度 | 説明 |
|-----------|---------|--------|------|
| auth.login | 認証 | 高 | ログイン成功 |
| auth.logout | 認証 | 中 | ログアウト |
| auth.login_failed | 認証 | 高 | ログイン失敗（不正アクセス検知用） |
| auth.password_change | 認証 | 高 | パスワード変更 |
| auth.mfa_enable | 認証 | 高 | MFA 有効化 |
| auth.mfa_disable | 認証 | 高 | MFA 無効化 |
| data.create | データ | 中 | リソース作成 |
| data.read | データ | 低 | リソース読み取り（設定による） |
| data.update | データ | 中 | リソース更新 |
| data.delete | データ | 高 | リソース削除 |
| data.export | データ | 高 | データエクスポート |
| perm.grant | 権限 | 高 | 権限付与 |
| perm.revoke | 権限 | 高 | 権限剥奪 |
| perm.role_change | 権限 | 高 | ロール変更 |
| settings.update | 設定 | 高 | 設定変更 |
| settings.billing_change | 設定 | 高 | 課金プラン変更 |
| admin.member_invite | 管理 | 高 | メンバー招待 |
| admin.member_remove | 管理 | 高 | メンバー削除 |
| admin.workspace_create | 管理 | 高 | ワークスペース作成 |
| admin.workspace_delete | 管理 | 高 | ワークスペース削除 |

---

## 3. ログデータ構造

### 3.1 テーブルスキーマ

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),       -- 操作者（null = システム操作）
  action VARCHAR(100) NOT NULL,                  -- アクション名（例: auth.login）
  resource_type VARCHAR(50),                     -- リソース種別（例: task, lead）
  resource_id UUID,                              -- 対象リソースID
  old_value JSONB,                               -- 変更前の値
  new_value JSONB,                               -- 変更後の値
  ip_address INET,                               -- クライアントIPアドレス
  user_agent TEXT,                                -- ユーザーエージェント
  metadata JSONB DEFAULT '{}',                    -- 追加情報
  workspace_id UUID,                             -- ワークスペースID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: INSERT のみ許可（APPEND ONLY）
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = audit_logs.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('OWNER', 'ADMIN')
    )
  );

-- UPDATE / DELETE は禁止（ポリシーなし = 拒否）
```

### 3.2 インデックス

```sql
-- タイムスタンプ降順（最新ログの検索）
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp DESC);

-- ユーザー別の検索
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);

-- アクション別の検索
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

-- リソース別の検索（複合インデックス）
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);

-- ワークスペース + タイムスタンプの複合インデックス
CREATE INDEX idx_audit_logs_workspace_time ON audit_logs (workspace_id, timestamp DESC);
```

---

## 4. ログ記録フロー

### 4.1 記録フロー図

```
[ユーザー操作]
  |
  v
[API ハンドラー（Route Handler）]
  |
  +-- ビジネスロジック実行
  |
  +-- logAuditEvent() 呼び出し
        |
        v
  +------------------------------------------+
  | ログデータ構築                            |
  |                                          |
  | - action: 操作種別                       |
  | - resource_type / resource_id: 対象      |
  | - old_value / new_value: 変更内容        |
  | - ip_address: リクエストヘッダーから取得  |
  | - user_agent: リクエストヘッダーから取得  |
  | - metadata: 追加コンテキスト             |
  +------------------------------------------+
        |
        v
  [INSERT INTO audit_logs]
        |
        v
  [レスポンス返却]
```

### 4.2 ログ記録関数

```typescript
// lib/server/audit.ts

interface AuditLogParams {
  action: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  workspaceId?: string;
}

export async function logAuditEvent(
  supabase: SupabaseClient,
  params: AuditLogParams
): Promise<void> {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      action: params.action,
      user_id: params.userId,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      metadata: params.metadata ?? {},
      workspace_id: params.workspaceId,
    });

  if (error) {
    // 監査ログの記録失敗はサービスを停止させない
    console.error('[AuditLog] Failed to record:', error);
  }
}
```

### 4.3 自動記録ポイント

| 記録ポイント | 対象アクション | 実装方法 |
|-------------|---------------|---------|
| 認証ミドルウェア | auth.login, auth.logout, auth.login_failed | Supabase Auth Webhook |
| API ルートハンドラー | data.create, data.update, data.delete | 各 Route Handler 内で呼び出し |
| 管理パネル | admin.*, perm.*, settings.* | Admin API 内で呼び出し |

### 4.4 API ルートでの利用例

```typescript
// app/api/tasks/route.ts（POST: タスク作成の例）

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  const body = await request.json();

  // タスク作成
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  if (error) throw error;

  // 監査ログ記録
  await logAuditEvent(supabase, {
    action: 'data.create',
    userId: user.id,
    resourceType: 'task',
    resourceId: task.id,
    newValue: task,
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
    workspaceId: body.workspace_id,
  });

  return NextResponse.json(task, { status: 201 });
}
```

---

## 5. ログ検索 UI

### 5.1 検索画面レイアウト

```
+------------------------------------------------------------------+
|  監査ログ                                                         |
+------------------------------------------------------------------+
|                                                                  |
|  [フィルター]                                                     |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |  期間: [2026/03/01] ~ [2026/03/05]   [今日] [7日] [30日]  |  |
|  |                                                            |  |
|  |  ユーザー: [全員        v]                                 |  |
|  |                                                            |  |
|  |  アクション: [すべて    v]   リソース: [すべて    v]       |  |
|  |                                                            |  |
|  |  [検索]  [リセット]                                        |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  検索結果: 142件                                                  |
|  +------------------------------------------------------------+  |
|  | タイムスタンプ     | ユーザー   | アクション  | 詳細       |  |
|  |------------------------------------------------------------|  |
|  | 2026/03/05 14:32  | user-a     | auth.login  | [詳細]     |  |
|  | 2026/03/05 14:30  | user-b     | data.create | [詳細]     |  |
|  | 2026/03/05 14:28  | user-a     | data.update | [詳細]     |  |
|  | 2026/03/05 14:25  | user-c     | perm.grant  | [詳細]     |  |
|  | 2026/03/05 14:20  | user-b     | data.delete | [詳細]     |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  [<前へ]  1 / 15 ページ  [次へ>]     表示件数: [10 v]            |
|                                                                  |
+------------------------------------------------------------------+
```

### 5.2 フィルターオプション

| フィルター | 種類 | 選択肢 |
|-----------|------|--------|
| 期間 | 日付範囲 | カスタム / 今日 / 過去7日 / 過去30日 / 過去90日 |
| ユーザー | ドロップダウン | 全員 / ワークスペースメンバー一覧 |
| アクション種別 | ドロップダウン | すべて / 認証 / データ操作 / 権限 / 設定 / 管理 |
| リソース種別 | ドロップダウン | すべて / task / lead / client / workspace / member |
| 重要度 | チェックボックス | 高 / 中 / 低 |

### 5.3 詳細ビュー

```
+------------------------------------------------------------------+
|  監査ログ詳細                                          [x 閉じる] |
+------------------------------------------------------------------+
|                                                                  |
|  ID: 550e8400-e29b-41d4-a716-446655440000                       |
|  タイムスタンプ: 2026-03-05T14:28:00+09:00                       |
|                                                                  |
|  ユーザー: user-a (user-a@example.com)                           |
|  アクション: data.update                                         |
|  リソース: task / 123e4567-e89b-12d3-a456-426614174000           |
|                                                                  |
|  変更前 (old_value):                                             |
|  {                                                               |
|    "title": "旧タイトル",                                        |
|    "status": "todo"                                              |
|  }                                                               |
|                                                                  |
|  変更後 (new_value):                                             |
|  {                                                               |
|    "title": "新タイトル",                                        |
|    "status": "in_progress"                                       |
|  }                                                               |
|                                                                  |
|  IPアドレス: 203.0.113.1                                         |
|  ユーザーエージェント: Mozilla/5.0 ...                            |
|                                                                  |
|  メタデータ:                                                     |
|  {                                                               |
|    "workspace_name": "My Workspace"                              |
|  }                                                               |
|                                                                  |
+------------------------------------------------------------------+
```

---

## 6. コンプライアンスレポート

### 6.1 月次レポート構成

| セクション | 内容 |
|-----------|------|
| サマリー | 期間内のイベント総数、カテゴリ別件数、異常検知件数 |
| セキュリティイベント | ログイン失敗回数、不正アクセス試行、権限変更履歴 |
| データ処理 | データエクスポート件数、データ削除件数、新規登録数 |
| 同意変更 | 同意取得数、同意撤回数、再同意件数 |

### 6.2 レポートデータ取得クエリ

```sql
-- サマリー: カテゴリ別イベント数
SELECT
  SPLIT_PART(action, '.', 1) AS category,
  COUNT(*) AS event_count
FROM audit_logs
WHERE timestamp >= :start_date
  AND timestamp < :end_date
  AND workspace_id = :workspace_id
GROUP BY category
ORDER BY event_count DESC;

-- セキュリティ: ログイン失敗の集計
SELECT
  DATE_TRUNC('day', timestamp) AS date,
  COUNT(*) AS failure_count,
  COUNT(DISTINCT ip_address) AS unique_ips
FROM audit_logs
WHERE action = 'auth.login_failed'
  AND timestamp >= :start_date
  AND timestamp < :end_date
GROUP BY date
ORDER BY date;

-- データ処理: エクスポート/削除の件数
SELECT
  action,
  COUNT(*) AS count,
  COUNT(DISTINCT user_id) AS unique_users
FROM audit_logs
WHERE action IN ('data.export', 'data.delete')
  AND timestamp >= :start_date
  AND timestamp < :end_date
  AND workspace_id = :workspace_id
GROUP BY action;

-- 同意変更: 種別ごとの取得/撤回
SELECT
  consent_type,
  COUNT(*) FILTER (WHERE granted = true AND withdrawn_at IS NULL) AS active_consents,
  COUNT(*) FILTER (WHERE withdrawn_at IS NOT NULL) AS withdrawals
FROM user_consents
WHERE granted_at >= :start_date
  AND granted_at < :end_date
GROUP BY consent_type;
```

### 6.3 出力形式

| 形式 | 用途 | 実装 |
|------|------|------|
| JSON | API 連携、自動処理 | GET /api/admin/reports/compliance?format=json |
| PDF | 印刷、監査提出用 | サーバーサイド PDF 生成（@react-pdf/renderer） |
| CSV | データ分析、Excel 取込 | GET /api/admin/reports/compliance?format=csv |

### 6.4 レポート API

```typescript
// GET /api/admin/reports/compliance
interface ComplianceReportParams {
  startDate: string;         // 開始日（ISO 8601）
  endDate: string;           // 終了日（ISO 8601）
  workspaceId: string;       // ワークスペースID
  format: 'json' | 'pdf' | 'csv';  // 出力形式
}

interface ComplianceReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalEvents: number;
    byCategory: Record<string, number>;
    anomaliesDetected: number;
  };
  security: {
    loginFailures: number;
    uniqueFailureIPs: number;
    permissionChanges: number;
    suspiciousActivities: SuspiciousActivity[];
  };
  dataProcessing: {
    exports: number;
    deletions: number;
    newRegistrations: number;
  };
  consent: {
    newConsents: number;
    withdrawals: number;
    reConsents: number;
  };
}
```

---

## 7. ログ保持ポリシー

### 7.1 環境別保持期間

| 環境 | 保持期間 | アーカイブ | 理由 |
|------|---------|-----------|------|
| development | 7日間 | なし | 開発用途のため短期保持 |
| staging | 30日間 | なし | テスト用途 |
| production | 1年間 | 7年間（オブジェクトストレージ） | コンプライアンス要件 |

### 7.2 アーカイブ設計

```
[アーカイブフロー]

毎月1日 00:00 UTC（バッチ処理）
  |
  v
+------------------------------------------+
| 1. 対象ログの抽出                         |
|    - 1年以上経過したログを SELECT          |
+------------------------------------------+
  |
  v
+------------------------------------------+
| 2. アーカイブファイル生成                  |
|    - JSON 形式でエクスポート               |
|    - gzip 圧縮                            |
|    - ファイル名: audit-logs-YYYY-MM.json.gz|
+------------------------------------------+
  |
  v
+------------------------------------------+
| 3. オブジェクトストレージへアップロード     |
|    - S3 互換ストレージ（Supabase Storage） |
|    - バケット: audit-archives             |
|    - パス: /YYYY/MM/                      |
+------------------------------------------+
  |
  v
+------------------------------------------+
| 4. 元データの削除                          |
|    - アーカイブ完了後に DELETE              |
|    - 削除ログをメタデータとして記録         |
+------------------------------------------+
  |
  v
+------------------------------------------+
| 5. アーカイブの7年後自動削除               |
|    - ライフサイクルポリシーで設定           |
+------------------------------------------+
```

### 7.3 アーカイブファイル形式

```typescript
// アーカイブファイルの構造
interface AuditLogArchive {
  archiveVersion: string;        // アーカイブ形式バージョン
  period: {
    start: string;               // 対象期間開始
    end: string;                 // 対象期間終了
  };
  metadata: {
    totalRecords: number;        // 総レコード数
    createdAt: string;           // アーカイブ作成日時
    checksum: string;            // SHA-256 チェックサム
  };
  records: AuditLogRecord[];     // ログレコード配列
}

// 圧縮後のファイルサイズ目安
// 10万レコード/月 -> 約 5MB (gzip圧縮後)
```

### 7.4 保持ポリシー設定

```sql
-- 開発環境: 7日超過ログの削除
DELETE FROM audit_logs
WHERE timestamp < NOW() - INTERVAL '7 days'
  AND current_setting('app.environment') = 'development';

-- ステージング: 30日超過ログの削除
DELETE FROM audit_logs
WHERE timestamp < NOW() - INTERVAL '30 days'
  AND current_setting('app.environment') = 'staging';

-- 本番: 1年超過ログのアーカイブ後削除
-- (アーカイブバッチ処理内で実行)
```

---

## 8. 実装チェックリスト

### Phase 79A: ログ基盤

- [ ] audit_logs テーブル作成（マイグレーション）
- [ ] RLS ポリシー設定（INSERT のみ / Admin SELECT）
- [ ] インデックス作成（timestamp, user_id, action, resource 複合）
- [ ] logAuditEvent() 関数の実装

### Phase 79B: 自動記録

- [ ] 認証イベントの自動記録（Auth Webhook 連携）
- [ ] API ルートハンドラーへのログ記録追加
- [ ] 管理パネル操作のログ記録追加
- [ ] データ変更時の old_value / new_value 記録

### Phase 79C: 検索 UI

- [ ] 監査ログ一覧画面（Admin ページ）
- [ ] フィルター機能（期間、ユーザー、アクション種別）
- [ ] ログ詳細モーダル
- [ ] ページネーション
- [ ] CSV エクスポート機能

### Phase 79D: コンプライアンスレポート

- [ ] 月次レポート生成 API
- [ ] レポートデータ集計クエリ
- [ ] JSON / CSV 出力
- [ ] PDF レポート生成（将来対応）
- [ ] レポートの自動メール送信（月次）

### Phase 79E: ログ保持・アーカイブ

- [ ] 環境別保持期間の設定
- [ ] アーカイブバッチ処理の実装
- [ ] オブジェクトストレージへのアップロード
- [ ] アーカイブファイルの整合性検証（チェックサム）
- [ ] 7年後自動削除のライフサイクルポリシー

---

**Last Updated**: 2026-03-05
**Phase**: 79
**Status**: 設計完了
