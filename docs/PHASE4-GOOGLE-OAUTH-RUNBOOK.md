# Phase 4: Google OAuth 認証ランブック

**バージョン:** v1.0.0
**作成日:** 2025-12-08
**前提条件:** Phase 3 完了（Supabase セットアップ済み）

---

## 1. 概要

### 1.1 目的

パスワード認証から Google OAuth 認証に移行し、本格的なログイン機能を実装する。

### 1.2 ゴール

| 項目 | 内容 |
|------|------|
| Google Cloud Console 設定 | OAuth 2.0 クライアント ID 作成 |
| Supabase Auth 設定 | Google プロバイダー有効化 |
| コールバック API | `/api/auth/callback` 実装 |
| ログインページ | Google ログインボタン追加 |
| middleware.ts | 認証保護ルート設定 |

### 1.3 成果物

```
app/
├── api/
│   └── auth/
│       └── callback/route.ts  # OAuth コールバック（更新）
├── login/
│   └── page.tsx               # Google ログインボタン追加
└── (app)/
    └── layout.tsx             # 認証チェック更新

lib/
└── supabase/
    └── client.ts              # createBrowserClient 追加

middleware.ts                   # 認証保護ミドルウェア
```

---

## 2. Google Cloud Console 設定

### 2.1 プロジェクト作成

1. https://console.cloud.google.com にアクセス
2. 「プロジェクトを選択」→「新しいプロジェクト」
3. プロジェクト名: `fdc-modular-starter`
4. 「作成」をクリック

### 2.2 OAuth 同意画面の設定

1. 左メニュー「APIとサービス」→「OAuth 同意画面」
2. User Type: 「外部」を選択 → 「作成」
3. 以下を入力：
   - **アプリ名**: `FDC Modular`
   - **ユーザーサポートメール**: 自分のメールアドレス
   - **デベロッパーの連絡先**: 自分のメールアドレス
4. 「保存して次へ」（スコープは後で設定）
5. テストユーザーに自分のメールを追加
6. 「保存して次へ」→「ダッシュボードに戻る」

### 2.3 OAuth クライアント ID 作成

1. 左メニュー「認証情報」→「認証情報を作成」→「OAuth クライアント ID」
2. アプリケーションの種類: **ウェブアプリケーション**
3. 名前: `FDC Modular Web`
4. **承認済みの JavaScript 生成元**:
   ```
   http://localhost:3000
   http://localhost:3004
   ```
5. **承認済みのリダイレクト URI**:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   ※ `<your-project-ref>` は Supabase の Project URL から取得
   ※ 例: `https://gizquwyuzxoozjtzhmrt.supabase.co/auth/v1/callback`
6. 「作成」をクリック
7. **クライアント ID** と **クライアントシークレット** をコピー

---

## 3. Supabase Auth 設定

### 3.1 Google プロバイダーを有効化

1. Supabase ダッシュボード → **Authentication** → **Providers**
2. **Google** をクリック
3. **Enable Sign in with Google** を ON
4. 以下を入力：
   - **Client ID**: Google Cloud Console でコピーした値
   - **Client Secret**: Google Cloud Console でコピーした値
5. 「Save」をクリック

### 3.2 Redirect URL の確認

Supabase ダッシュボード → **Authentication** → **URL Configuration**

以下をコピーして Google Cloud Console の「承認済みのリダイレクト URI」に追加：
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

---

## 4. 環境変数の追加

`.env.local` に以下を追加（既存の変数はそのまま）：

```bash
# Google OAuth（オプション：直接 API を使う場合）
# Supabase Auth 経由なら不要
# GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=xxxxx
```

---

## 5. users テーブルの更新

Google 認証に対応するため、`google_sub` カラムを追加：

```sql
-- users テーブルに google_sub カラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);
```

---

## 6. 実装手順

### 6.1 実装ファイル一覧

| ファイル | 内容 | 優先度 |
|---------|------|--------|
| `lib/supabase/client.ts` | ブラウザクライアント追加 | 必須 |
| `app/api/auth/callback/route.ts` | OAuth コールバック | 必須 |
| `app/login/page.tsx` | Google ログインボタン | 必須 |
| `app/(app)/layout.tsx` | 認証チェック更新 | 必須 |
| `middleware.ts` | 認証保護ミドルウェア | 推奨 |

### 6.2 実装パターン（参照: references/api/auth/callback/route.ts）

**OAuth コールバックの流れ：**

```
1. Google OAuth 完了 → Supabase にリダイレクト
2. Supabase → /api/auth/callback?code=xxx にリダイレクト
3. コールバック API で：
   a. exchangeCodeForSession() で認証情報取得
   b. users テーブルに upsert
   c. sessions テーブルにセッション作成
   d. fdc_session Cookie をセット
   e. /dashboard にリダイレクト
```

**主要コード（簡略版）：**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// app/login/page.tsx - Google ログイン
const handleGoogleLogin = async () => {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
};

// app/api/auth/callback/route.ts
export async function GET(request: NextRequest) {
  const code = searchParams.get('code');

  // 1. Supabase クライアント作成
  const supabase = createServerClient(...);

  // 2. コード交換
  const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

  // 3. ユーザー upsert
  const supabaseAdmin = createClient(..., SERVICE_ROLE_KEY);
  await supabaseAdmin.from('users').upsert({
    google_sub: user.id,
    email: user.email,
    name: user.user_metadata.full_name,
    picture: user.user_metadata.avatar_url,
  });

  // 4. セッション作成
  const sessionToken = `fdc_${crypto.randomUUID()}`;
  await supabaseAdmin.from('sessions').insert({...});

  // 5. Cookie セット
  response.cookies.set('fdc_session', sessionToken, {...});

  return response;
}
```

---

## 7. middleware.ts

認証が必要なルートを保護：

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('fdc_session')?.value;
  const { pathname } = request.nextUrl;

  // 認証が必要なルート
  const protectedRoutes = ['/dashboard', '/tasks', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // 未認証で保護ルートにアクセス → ログインへ
  if (isProtectedRoute && !sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 認証済みでログインページにアクセス → ダッシュボードへ
  if (pathname === '/login' && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/tasks/:path*', '/settings/:path*', '/login'],
};
```

---

## 8. 検証チェックリスト

### 8.1 Google Cloud Console

- [ ] OAuth 同意画面が設定済み
- [ ] OAuth クライアント ID が作成済み
- [ ] リダイレクト URI が正しく設定されている

### 8.2 Supabase

- [ ] Google プロバイダーが有効
- [ ] Client ID / Secret が設定済み
- [ ] users テーブルに google_sub カラムがある

### 8.3 動作確認

- [ ] ログインページに Google ログインボタンが表示される
- [ ] Google ログインボタンをクリックすると Google 認証画面に遷移
- [ ] 認証後、/dashboard にリダイレクトされる
- [ ] ヘッダーにユーザー名が表示される
- [ ] ログアウトが正常に動作する
- [ ] 未認証で /dashboard にアクセスすると /login にリダイレクト

### 8.4 型チェック・ビルド

```bash
# 型チェック
npx tsc --noEmit

# ビルド
npm run build
```

---

## 9. トラブルシューティング

### 9.1 「redirect_uri_mismatch」エラー

**原因**: Google Cloud Console のリダイレクト URI が間違っている

**解決策**:
1. Supabase ダッシュボード → Authentication → URL Configuration
2. 「Callback URL」をコピー
3. Google Cloud Console の「承認済みのリダイレクト URI」に追加

### 9.2 「access_denied」エラー

**原因**: OAuth 同意画面でテストユーザーが登録されていない

**解決策**:
1. Google Cloud Console → OAuth 同意画面 → テストユーザー
2. 自分のメールアドレスを追加

### 9.3 セッションが保存されない

**原因**: SERVICE_ROLE_KEY が設定されていない

**解決策**:
1. `.env.local` に `SUPABASE_SERVICE_ROLE_KEY` があるか確認
2. 開発サーバーを再起動

### 9.4 Cookie が設定されない

**原因**: sameSite / secure 設定の問題

**解決策**:
開発環境では以下の設定を使用：
```typescript
response.cookies.set('fdc_session', token, {
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7,
});
```

---

## 10. セキュリティ考慮事項

1. **SERVICE_ROLE_KEY は絶対にクライアントに露出させない**
2. **Cookie は httpOnly で設定**（XSS 対策）
3. **sameSite: 'lax'** で CSRF 対策
4. **本番環境では secure: true**

---

## 11. 次のステップ

Phase 4 完了後、以下に進む：

1. **Phase 5**: ワークスペース機能
   - workspaces テーブル作成
   - workspace_members テーブル作成
   - タスクデータの DB 保存

---

**Last Updated**: 2025-12-08
**Version**: v1.0.0
