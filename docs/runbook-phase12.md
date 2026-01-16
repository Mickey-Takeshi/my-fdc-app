# Phase 12: Google Calendar/Tasks API 連携（Supabase Auth 拡張）

## このPhaseの目標

Phase 4 で設定した Supabase Auth + Google OAuth に Calendar/Tasks スコープを追加：
- Google Cloud Console で Calendar/Tasks API を有効化・スコープ追加
- Supabase Dashboard で追加スコープを設定
- /api/auth/callback を拡張して provider_token を保存

---

## 【重要】認証フローの理解

```
════════════════════════════════════════════════════════════════════
  FDC の認証フロー（ログイン ＝ カレンダー連携）
════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  ユーザー                                                       │
│       ↓                                                         │
│  ログインボタンをクリック                                        │
│       ↓                                                         │
│  Supabase Auth                                                  │
│       ↓                                                         │
│  Google OAuth 画面                                              │
│  ┌───────────────────────────────────────────┐                 │
│  │ FDC Workshop がアクセスを求めています:     │                 │
│  │ ✓ 基本的なプロフィール情報                 │                 │
│  │ ✓ メールアドレス                           │                 │
│  │ ✓ Google カレンダーの予定を表示・編集      │  ← ここ！        │
│  │ ✓ Google Tasks の表示・編集               │  ← ここ！        │
│  │              [許可]  [キャンセル]          │                 │
│  └───────────────────────────────────────────┘                 │
│       ↓                                                         │
│  /api/auth/callback                                             │
│  ┌───────────────────────────────────────────┐                 │
│  │ 1. Supabase から session 取得              │                 │
│  │ 2. session.provider_token 取得             │  ← Calendar権限 │
│  │ 3. session.provider_refresh_token 取得     │                 │
│  │ 4. 暗号化して DB に保存                    │                 │
│  │ 5. fdc_session Cookie 設定                 │                 │
│  └───────────────────────────────────────────┘                 │
│       ↓                                                         │
│  ダッシュボードへリダイレクト                                    │
│  （ログイン完了 ＆ カレンダー連携完了）                          │
└─────────────────────────────────────────────────────────────────┘
```

**ポイント**:
- ログインとカレンダー連携は **同時に** 行われる
- Supabase Auth が OAuth フロー全体を管理
- provider_token に Calendar/Tasks アクセス権限が含まれる
- 別途「カレンダー連携」ボタンは不要

---

## 習得する新しい概念

- **provider_token**: Supabase Auth 経由で取得した Google API トークン
- **OAuth スコープ**: APIアクセス権限の範囲。必要最小限を要求するのが原則
- **センシティブスコープ**: Calendar/Tasks など個人情報にアクセスするスコープ
- **トークン暗号化**: リフレッシュトークンを安全に保存するためAES-256で暗号化

---

## 前提条件

- Phase 4 完了（Supabase Auth + Google OAuth でログインできる）
- Google Cloud Console にアクセス可能
- **Supabase CLI 導入済み**（`npx supabase --version` で確認）

---

## 追加するスコープ

| スコープ | 用途 |
|---------|------|
| https://www.googleapis.com/auth/calendar.readonly | カレンダー読み取り |
| https://www.googleapis.com/auth/calendar.events | カレンダー書き込み |
| https://www.googleapis.com/auth/tasks | タスク読み書き |

---

## Step 1: Google Cloud Console 設定（手動）

### 1.1 Calendar API 有効化

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択
3. 「APIとサービス」→「ライブラリ」
4. 「Google Calendar API」を検索して「有効にする」

### 1.2 Tasks API 有効化

1. 同様に「Tasks API」を検索して「有効にする」

### 1.3 OAuth 同意画面でスコープ追加

1. 「APIとサービス」→「OAuth 同意画面」
2. 「アプリを編集」
3. 「スコープを追加または削除」をクリック
4. 以下のスコープを追加：
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/tasks`
5. 「保存して次へ」

### 確認ポイント

- [ ] Calendar API が有効になっている
- [ ] Tasks API が有効になっている
- [ ] OAuth 同意画面に Calendar/Tasks スコープが追加されている

---

## Step 2: Supabase Dashboard 設定（手動）

### 2.1 Google Provider にスコープ追加

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. Authentication → Providers → Google
4. 「Additional scopes」に以下を追加（空白区切り）:

```
https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks
```

5. 「Save」をクリック

### 確認ポイント

- [ ] Supabase の Google Provider に Calendar/Tasks スコープが追加されている

---

## Step 3: 環境変数設定

### 3.1 暗号化キー生成

ターミナルで実行：

```bash
openssl rand -base64 32
```

### 3.2 .env.local に追加

**ファイル**: `.env.local`

```bash
# 既存の設定（Phase 4 から）
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Phase 12 追加
TOKEN_ENCRYPTION_KEY=<上で生成した値>
```

### 確認ポイント

- [ ] TOKEN_ENCRYPTION_KEY が .env.local に追加されている
- [ ] キーは32バイト（base64エンコードで44文字程度）

---

## Step 4: データベーススキーマ更新

### 4.1 users テーブルにカラム追加

Supabase SQL エディタで実行：

```sql
-- ========================================
-- Phase 12: users テーブルに Google トークン用カラム追加
-- ========================================

-- Google API トークン用カラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_api_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_scopes TEXT[];

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_users_google_api_enabled ON users(google_api_enabled);
```

### 確認ポイント

- [ ] users テーブルに google_access_token カラムが追加された
- [ ] users テーブルに google_refresh_token カラムが追加された
- [ ] users テーブルに google_token_expires_at カラムが追加された
- [ ] users テーブルに google_api_enabled カラムが追加された
- [ ] users テーブルに google_scopes カラムが追加された

---

## Step 5: 暗号化ユーティリティ実装

### 5.1 encryption.ts

**ファイル**: `lib/server/encryption.ts`

```typescript
/**
 * lib/server/encryption.ts
 *
 * Phase 12: トークン暗号化ユーティリティ
 * AES-256-GCM を使用した暗号化/復号
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;  // 128ビット

/**
 * 暗号化キーを取得
 */
function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured');
  }
  return Buffer.from(key, 'base64');
}

/**
 * テキストを暗号化
 * @param plainText 平文
 * @returns 暗号文（iv:authTag:encrypted の形式、base64エンコード）
 */
export function encrypt(plainText: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // iv:authTag:encrypted の形式で結合
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * 暗号文を復号
 * @param encryptedText 暗号文（iv:authTag:encrypted の形式）
 * @returns 平文
 */
export function decrypt(encryptedText: string): string {
  const key = getKey();

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * 暗号化キーが設定されているか確認
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.TOKEN_ENCRYPTION_KEY;
}
```

### 確認ポイント

- [ ] `lib/server/encryption.ts` が作成された
- [ ] encrypt/decrypt 関数が実装されている
- [ ] AES-256-GCM を使用している

---

## Step 6: /api/auth/callback の拡張

### 6.1 callback/route.ts を更新

**ファイル**: `app/api/auth/callback/route.ts`

既存のコールバック処理に以下を追加：

```typescript
/**
 * app/api/auth/callback/route.ts
 *
 * Phase 12: provider_token を暗号化して保存
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/client';
import { encrypt } from '@/lib/server/encryption';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Cookie 設定は response で行う
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const session = data.session;
      const userId = session.user.id;

      // ========================================
      // Phase 12: provider_token を保存
      // ========================================
      const providerToken = session.provider_token;
      const providerRefreshToken = session.provider_refresh_token;

      if (providerToken) {
        const supabaseAdmin = createAdminClient();

        if (supabaseAdmin) {
          try {
            // アクセストークンを暗号化
            const encryptedAccessToken = encrypt(providerToken);
            const tokenExpiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

            const updateData: Record<string, unknown> = {
              google_access_token: encryptedAccessToken,
              google_token_expires_at: tokenExpiresAt,
              google_api_enabled: true,
              google_scopes: [
                'https://www.googleapis.com/auth/calendar.readonly',
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/tasks',
              ],
            };

            // リフレッシュトークンがある場合は暗号化して保存
            if (providerRefreshToken) {
              updateData.google_refresh_token = encrypt(providerRefreshToken);
            }

            await supabaseAdmin.from('users').update(updateData).eq('id', userId);

            console.log('[Auth Callback] Google tokens saved for user:', userId);
          } catch (err) {
            console.error('[Auth Callback] Failed to save Google tokens:', err);
          }
        }
      }
      // ========================================

      // 既存のセッション処理（fdc_session Cookie 設定など）
      // ... 既存のコード ...

      const response = NextResponse.redirect(`${origin}${next}`);

      // Supabase の Cookie を設定
      // ... 既存のコード ...

      return response;
    }
  }

  // エラー時はログインページへ
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

### 確認ポイント

- [ ] callback/route.ts に provider_token 保存処理が追加された
- [ ] provider_token が暗号化されている
- [ ] provider_refresh_token も暗号化されている

---

## Step 7: トークン管理ユーティリティ

### 7.1 google-tokens.ts

**ファイル**: `lib/server/google-tokens.ts`

```typescript
/**
 * lib/server/google-tokens.ts
 *
 * Phase 12: Google トークン管理
 */

import { createAdminClient } from '@/lib/supabase/client';
import { encrypt, decrypt } from '@/lib/server/encryption';

interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
}

/**
 * ユーザーの Google トークンを取得（復号）
 */
export async function getGoogleTokens(userId: string): Promise<GoogleTokens | null> {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expires_at, google_scopes')
    .eq('id', userId)
    .single();

  if (error || !data?.google_access_token) {
    return null;
  }

  try {
    return {
      accessToken: decrypt(data.google_access_token),
      refreshToken: data.google_refresh_token ? decrypt(data.google_refresh_token) : undefined,
      expiresAt: data.google_token_expires_at ? new Date(data.google_token_expires_at) : undefined,
      scopes: data.google_scopes,
    };
  } catch (err) {
    console.error('Error decrypting tokens:', err);
    return null;
  }
}

/**
 * トークンが期限切れかどうか確認
 */
export function isTokenExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return true;
  // 5分の余裕を持たせる
  return new Date() >= new Date(expiresAt.getTime() - 5 * 60 * 1000);
}

/**
 * リフレッシュトークンでアクセストークンを更新
 */
export async function refreshGoogleAccessToken(userId: string): Promise<string | null> {
  const tokens = await getGoogleTokens(userId);
  if (!tokens?.refreshToken) {
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    console.error('Failed to refresh token:', await response.text());
    return null;
  }

  const data = await response.json();

  // 新しいトークンを保存
  const supabase = createAdminClient();
  if (supabase) {
    await supabase.from('users').update({
      google_access_token: encrypt(data.access_token),
      google_token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    }).eq('id', userId);
  }

  return data.access_token;
}

/**
 * 有効なアクセストークンを取得（必要に応じてリフレッシュ）
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const tokens = await getGoogleTokens(userId);
  if (!tokens) {
    return null;
  }

  if (!isTokenExpired(tokens.expiresAt)) {
    return tokens.accessToken;
  }

  // トークンが期限切れの場合はリフレッシュ
  return refreshGoogleAccessToken(userId);
}

/**
 * Google 連携を解除
 */
export async function disconnectGoogle(userId: string): Promise<void> {
  const tokens = await getGoogleTokens(userId);

  // Google 側でトークンを無効化
  if (tokens?.accessToken) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.accessToken}`, {
      method: 'POST',
    }).catch(() => {});
  }

  // DB からトークンを削除
  const supabase = createAdminClient();
  if (supabase) {
    await supabase.from('users').update({
      google_access_token: null,
      google_refresh_token: null,
      google_token_expires_at: null,
      google_api_enabled: false,
      google_scopes: null,
    }).eq('id', userId);
  }
}
```

### 確認ポイント

- [ ] `lib/server/google-tokens.ts` が作成された
- [ ] getGoogleTokens が復号して取得する
- [ ] refreshGoogleAccessToken がトークンを更新する
- [ ] getValidAccessToken が自動リフレッシュする

---

## Step 8: Google 連携状態確認 API

### 8.1 status/route.ts

**ファイル**: `app/api/google/status/route.ts`

```typescript
/**
 * app/api/google/status/route.ts
 *
 * Phase 12: Google 連携状態確認
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/server/auth';
import { getGoogleTokens, isTokenExpired } from '@/lib/server/google-tokens';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('fdc_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await validateSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const tokens = await getGoogleTokens(session.userId);

    if (!tokens) {
      return NextResponse.json({
        connected: false,
        scopes: [],
      });
    }

    return NextResponse.json({
      connected: true,
      scopes: tokens.scopes || [],
      expiresAt: tokens.expiresAt?.toISOString(),
      isExpired: isTokenExpired(tokens.expiresAt),
      hasRefreshToken: !!tokens.refreshToken,
    });
  } catch (error) {
    console.error('Error in GET /api/google/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 確認ポイント

- [ ] `app/api/google/status/route.ts` が作成された
- [ ] 連携状態を正しく返す

---

## Step 9: ビルド確認

```bash
npm run build
```

### 確認ポイント

- [ ] TypeScript エラーがない
- [ ] ビルドが成功する

---

## 完了チェックリスト

### Google Cloud Console

- [ ] Calendar API が有効
- [ ] Tasks API が有効
- [ ] OAuth 同意画面にスコープが追加されている

### Supabase Dashboard

- [ ] Google Provider に Calendar/Tasks スコープが追加されている

### 環境変数

- [ ] TOKEN_ENCRYPTION_KEY が設定されている

### データベース

- [ ] users テーブルに Google トークン用カラムが追加されている

### ファイル

- [ ] `lib/server/encryption.ts` - 暗号化ユーティリティ
- [ ] `lib/server/google-tokens.ts` - トークン管理
- [ ] `app/api/auth/callback/route.ts` - コールバック拡張
- [ ] `app/api/google/status/route.ts` - 状態確認

### 機能確認

- [ ] ログイン時に Calendar/Tasks スコープで認証される
- [ ] provider_token が暗号化されて users テーブルに保存される
- [ ] /api/google/status で連携状態が確認できる
- [ ] トークンが期限切れの場合、自動でリフレッシュされる

### 習得した概念

- [ ] Supabase Auth の provider_token の活用
- [ ] OAuth スコープの追加方法
- [ ] トークンの暗号化保存
- [ ] リフレッシュトークンの管理

---

## 次のPhase

Phase 13 では、この基盤を使って実際に Google Calendar/Tasks との同期機能を実装します。
