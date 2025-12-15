# Phase 3: Supabase 認証基盤構築ランブック

**バージョン:** v1.0.0
**作成日:** 2025-12-07
**前提条件:** Phase 0-2 完了（タスク機能、設定ページがlocalStorageで動作）

---

## 1. 概要

### 1.1 目的

Phase 0-2 で構築した localStorage ベースの認証をデータベース連携の本格認証に移行する。

### 1.2 ゴール

| 項目 | 内容 |
|------|------|
| Supabase プロジェクト作成 | PostgreSQL データベース稼働 |
| 環境変数設定 | `.env.local` に接続情報を設定 |
| テーブル作成 | `users`, `sessions` テーブル作成 |
| RLS 設定 | Row Level Security でデータ保護 |

### 1.3 成果物

```
lib/
├── supabase/
│   └── client.ts          # Supabase クライアント初期化
├── server/
│   ├── auth.ts            # 認証ヘルパー（セッション管理）
│   └── db.ts              # DB アクセス層
└── types/
    └── database.ts        # DB 型定義（更新）

app/
├── api/
│   └── auth/
│       ├── session/route.ts   # セッション取得 API
│       └── logout/route.ts    # ログアウト API
└── login/
    └── page.tsx           # ログインページ（Supabase 連携）
```

---

## 2. Supabase プロジェクト作成

### 2.1 アカウント作成・プロジェクト作成

1. https://supabase.com にアクセス
2. GitHub アカウントでサインアップ
3. 「New Project」をクリック
4. 以下を設定：
   - **Organization**: 新規作成または既存を選択
   - **Project name**: `fdc-modular-starter`
   - **Database Password**: 強力なパスワードを設定（保存しておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択
5. 「Create new project」をクリック

### 2.2 接続情報の取得

プロジェクト作成後、以下の情報を取得：

1. **Project Settings** → **API** に移動
2. 以下をコピー：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. 環境変数設定

### 3.1 `.env.local` の作成

プロジェクトルートに `.env.local` を作成：

```bash
# Supabase 接続情報
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# セッション設定
SESSION_SECRET=your-random-secret-key-here
```

### 3.2 `.gitignore` の確認

`.env.local` が `.gitignore` に含まれていることを確認：

```gitignore
# env files
.env*.local
```

---

## 4. テーブル作成

### 4.1 SQL Editor でテーブルを作成

Supabase Dashboard → **SQL Editor** で以下を実行：

```sql
-- ========================================
-- Phase 3: 認証テーブル作成
-- ========================================

-- users テーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  account_type TEXT DEFAULT 'USER' CHECK (account_type IN ('SA', 'USER', 'TEST')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- sessions テーブル
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 確認
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('users', 'sessions');
```

### 4.2 テーブル構造

**users テーブル**

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー（自動生成） |
| email | TEXT | メールアドレス（ユニーク） |
| name | TEXT | 表示名 |
| picture | TEXT | プロフィール画像URL |
| account_type | TEXT | アカウント種別（SA/USER/TEST） |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

**sessions テーブル**

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー（自動生成） |
| user_id | UUID | ユーザーID（外部キー） |
| token | TEXT | セッショントークン（ユニーク） |
| expires_at | TIMESTAMPTZ | 有効期限 |
| created_at | TIMESTAMPTZ | 作成日時 |

---

## 5. RLS（Row Level Security）設定

### 5.1 RLS ポリシーを作成

SQL Editor で以下を実行：

```sql
-- ========================================
-- Phase 3: RLS ポリシー設定
-- ========================================

-- RLS を有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- users テーブルのポリシー
-- サービスロールは全操作可能（API経由のみ）
CREATE POLICY "Service role can manage users"
  ON users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- sessions テーブルのポリシー
-- サービスロールは全操作可能
CREATE POLICY "Service role can manage sessions"
  ON sessions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('users', 'sessions');
```

### 5.2 RLS の仕組み

- **anon key**: 公開鍵、RLS ポリシーに従う
- **service_role key**: 管理者鍵、RLS をバイパス
- API ルートでは `service_role key` を使用してデータを操作

---

## 6. 実装手順

### 6.1 Supabase クライアントのインストール

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 6.2 実装ファイル一覧

| ファイル | 内容 | 優先度 |
|---------|------|--------|
| `lib/supabase/client.ts` | Supabase クライアント初期化 | 必須 |
| `lib/server/auth.ts` | セッション管理ヘルパー | 必須 |
| `lib/types/database.ts` | DB 型定義の更新 | 必須 |
| `app/api/auth/session/route.ts` | セッション取得 API | 必須 |
| `app/api/auth/logout/route.ts` | ログアウト API | 必須 |
| `app/login/page.tsx` | ログインページの更新 | 必須 |
| `app/(app)/layout.tsx` | 認証チェックの更新 | 必須 |

### 6.3 実装の流れ

```
1. Supabase クライアント作成
   └── lib/supabase/client.ts

2. 認証ヘルパー作成
   └── lib/server/auth.ts（createSession, validateSession, deleteSession）

3. API ルート作成
   ├── app/api/auth/session/route.ts（GET: セッション取得）
   └── app/api/auth/logout/route.ts（POST: ログアウト）

4. ログインページ更新
   └── app/login/page.tsx（パスワード認証 → DB ユーザー作成）

5. 認証チェック更新
   └── app/(app)/layout.tsx（localStorage → API 経由）
```

---

## 7. 参照実装

### 7.1 セッション取得 API（参照: references/api/auth/session/route.ts）

主要な実装パターン：

```typescript
// Supabase クライアント作成（SERVICE_ROLE_KEY でRLSバイパス）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// セッション検索
const { data: sessionData, error: sessionError } = await supabase
  .from('sessions')
  .select('user_id, expires_at')
  .eq('token', sessionToken)
  .gte('expires_at', new Date().toISOString())
  .single();

// ユーザー情報取得
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('id, email, name, picture')
  .eq('id', sessionData.user_id)
  .single();
```

### 7.2 ログアウト API（参照: references/api/auth/logout/route.ts）

主要な実装パターン：

```typescript
// セッション削除
await supabase
  .from('sessions')
  .delete()
  .eq('token', sessionToken);

// Cookie 削除
response.cookies.delete('fdc_session');
```

### 7.3 型定義（参照: references/types/database.ts）

```typescript
export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  accountType: 'SA' | 'USER' | 'TEST';
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
```

---

## 8. 検証チェックリスト

### 8.1 Supabase 設定確認

- [ ] プロジェクトが正常に作成された
- [ ] `.env.local` に接続情報が設定された
- [ ] `users` テーブルが作成された
- [ ] `sessions` テーブルが作成された
- [ ] RLS が有効化された

### 8.2 動作確認

- [ ] ログインページでユーザー作成ができる
- [ ] ログイン後にセッションが作成される
- [ ] `/dashboard` にアクセスできる
- [ ] ログアウトでセッションが削除される
- [ ] 無効なセッションでは `/login` にリダイレクトされる

### 8.3 型チェック・ビルド

```bash
# 型チェック
npx tsc --noEmit

# ビルド
npm run build
```

---

## 9. トラブルシューティング

### 9.1 接続エラー

**症状**: `NEXT_PUBLIC_SUPABASE_URL is not defined`

**解決策**:
1. `.env.local` が正しく作成されているか確認
2. 開発サーバーを再起動

### 9.2 RLS エラー

**症状**: `new row violates row-level security policy`

**解決策**:
1. `SUPABASE_SERVICE_ROLE_KEY` を使用しているか確認
2. RLS ポリシーが正しく設定されているか確認

### 9.3 セッション取得失敗

**症状**: `401 Unauthorized`

**解決策**:
1. Cookie `fdc_session` が設定されているか確認
2. セッションが有効期限内か確認
3. `sessions` テーブルにレコードが存在するか確認

---

## 10. 次のステップ

Phase 3 完了後、以下に進む：

1. **Phase 4**: Google OAuth 認証
   - Supabase Auth を使用した Google ログイン
   - OAuth コールバック処理

2. **Phase 5**: ワークスペース機能
   - `workspaces` テーブル作成
   - `workspace_members` テーブル作成
   - タスクデータの DB 保存

---

## 11. コーディング規約（DEVELOPMENT.md より）

### 11.1 TypeScript strict mode

- `any` 型の使用禁止
- 可能な限り具体的な型を使用

### 11.2 ファイル命名

- コンポーネント: `PascalCase.tsx`
- フック: `useCamelCase.ts`
- API: `route.ts`

### 11.3 インポート順序

1. React / Next.js
2. 外部ライブラリ
3. 内部モジュール（`@/lib/*`）
4. 型定義
5. スタイル

---

**Last Updated**: 2025-12-07
**Version**: v1.0.0
