# Phase 20: セキュリティ強化（RLS・CSP・OWASP対策）

## 目標

本番運用に向けたセキュリティ対策を実装：
- 全テーブルに RLS（Row Level Security）を設定
- CSP（Content Security Policy）ヘッダーの設定
- OWASP Top 10 への対策

## 習得する新しい概念

| 概念 | 説明 |
|------|------|
| **RLS** | データベース行レベルのアクセス制御。誰がどの行を読み書きできるかを定義 |
| **CSP** | ブラウザで読み込めるリソース（スクリプト、スタイル等）を制限 |
| **OWASP Top 10** | 最も重大なWebセキュリティリスクのリスト |
| **入力サニタイズ** | ユーザー入力から危険な文字を無害化 |

## 前提条件

- [ ] Phase 1-19 完了
- [ ] Supabase プロジェクト作成済み
- [ ] 全テーブルが作成済み

---

## Step 1: RLS（Row Level Security）の設定

### 1.1 RLSとサーバーサイド認可の理解

FDCでは**サーバーサイド認可**を主に使用していますが、多層防御としてRLSも設定します。

**現在のFDCの認可フロー：**
```
クライアント → API Route (認可チェック) → Supabase (Service Role Key)
```

**RLS追加後：**
```
クライアント → API Route (認可チェック) → Supabase (Service Role Key + RLS)
```

### 1.2 RLSマイグレーションファイルの作成

**ファイル: `supabase/migrations/20240120000001_enable_rls.sql`**

```sql
-- ===========================================
-- Phase 20: Row Level Security (RLS) 設定
-- ===========================================

-- ============================================
-- 1. users テーブル
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 自分自身のレコードのみ参照可能
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- 自分自身のレコードのみ更新可能
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid());

-- ============================================
-- 2. workspaces テーブル
-- ============================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- メンバーのみワークスペースを参照可能
CREATE POLICY "Members can view workspace"
ON workspaces FOR SELECT
USING (
  id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- 認証済みユーザーは新規作成可能
CREATE POLICY "Authenticated users can create workspace"
ON workspaces FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- オーナーのみ更新可能
CREATE POLICY "Owner can update workspace"
ON workspaces FOR UPDATE
USING (
  id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role = 'OWNER'
  )
);

-- オーナーのみ削除可能
CREATE POLICY "Owner can delete workspace"
ON workspaces FOR DELETE
USING (
  id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role = 'OWNER'
  )
);

-- ============================================
-- 3. workspace_members テーブル
-- ============================================
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- メンバーは同じワークスペースのメンバー一覧を参照可能
CREATE POLICY "Members can view workspace members"
ON workspace_members FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ADMIN以上のみメンバー追加可能
CREATE POLICY "Admin can add members"
ON workspace_members FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ADMIN以上のみメンバー更新可能
CREATE POLICY "Admin can update members"
ON workspace_members FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ADMIN以上のみメンバー削除可能
CREATE POLICY "Admin can remove members"
ON workspace_members FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ============================================
-- 4. tasks テーブル
-- ============================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- メンバーのみ参照可能
CREATE POLICY "Members can view tasks"
ON tasks FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- メンバーのみ作成可能
CREATE POLICY "Members can create tasks"
ON tasks FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- メンバーのみ更新可能
CREATE POLICY "Members can update tasks"
ON tasks FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- メンバーのみ削除可能
CREATE POLICY "Members can delete tasks"
ON tasks FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 5. brands テーブル
-- ============================================
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view brands"
ON brands FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can create brands"
ON brands FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can update brands"
ON brands FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete brands"
ON brands FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 6. brand_mvv テーブル
-- ============================================
ALTER TABLE brand_mvv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view brand_mvv"
ON brand_mvv FOR SELECT
USING (
  brand_id IN (
    SELECT b.id FROM brands b
    JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage brand_mvv"
ON brand_mvv FOR ALL
USING (
  brand_id IN (
    SELECT b.id FROM brands b
    JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

-- ============================================
-- 7. leads テーブル
-- ============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view leads"
ON leads FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can create leads"
ON leads FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can update leads"
ON leads FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete leads"
ON leads FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 8. clients テーブル
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view clients"
ON clients FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can create clients"
ON clients FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can update clients"
ON clients FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete clients"
ON clients FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 9. objectives テーブル (OKR)
-- ============================================
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view objectives"
ON objectives FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage objectives"
ON objectives FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 10. key_results テーブル (OKR)
-- ============================================
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view key_results"
ON key_results FOR SELECT
USING (
  objective_id IN (
    SELECT o.id FROM objectives o
    JOIN workspace_members wm ON o.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage key_results"
ON key_results FOR ALL
USING (
  objective_id IN (
    SELECT o.id FROM objectives o
    JOIN workspace_members wm ON o.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

-- ============================================
-- 11. action_maps テーブル
-- ============================================
ALTER TABLE action_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view action_maps"
ON action_maps FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage action_maps"
ON action_maps FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 12. action_map_items テーブル
-- ============================================
ALTER TABLE action_map_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view action_map_items"
ON action_map_items FOR SELECT
USING (
  map_id IN (
    SELECT am.id FROM action_maps am
    JOIN workspace_members wm ON am.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage action_map_items"
ON action_map_items FOR ALL
USING (
  map_id IN (
    SELECT am.id FROM action_maps am
    JOIN workspace_members wm ON am.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

-- ============================================
-- 13. lean_canvases テーブル
-- ============================================
ALTER TABLE lean_canvases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view lean_canvases"
ON lean_canvases FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage lean_canvases"
ON lean_canvases FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 14. lean_canvas_blocks テーブル
-- ============================================
ALTER TABLE lean_canvas_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view lean_canvas_blocks"
ON lean_canvas_blocks FOR SELECT
USING (
  canvas_id IN (
    SELECT lc.id FROM lean_canvases lc
    JOIN workspace_members wm ON lc.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage lean_canvas_blocks"
ON lean_canvas_blocks FOR ALL
USING (
  canvas_id IN (
    SELECT lc.id FROM lean_canvases lc
    JOIN workspace_members wm ON lc.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

-- ============================================
-- 15. approaches テーブル
-- ============================================
ALTER TABLE approaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view approaches"
ON approaches FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage approaches"
ON approaches FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 16. goals テーブル
-- ============================================
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view goals"
ON goals FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage goals"
ON goals FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 17. workspace_invitations テーブル
-- ============================================
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- ADMIN以上のみ参照可能
CREATE POLICY "Admin can view invitations"
ON workspace_invitations FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ADMIN以上のみ作成可能
CREATE POLICY "Admin can create invitations"
ON workspace_invitations FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ADMIN以上のみ削除可能
CREATE POLICY "Admin can delete invitations"
ON workspace_invitations FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- ============================================
-- 18. sessions テーブル
-- ============================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 自分のセッションのみ参照可能
CREATE POLICY "Users can view own sessions"
ON sessions FOR SELECT
USING (user_id = auth.uid());

-- 自分のセッションのみ削除可能
CREATE POLICY "Users can delete own sessions"
ON sessions FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 19. google_tokens テーブル
-- ============================================
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- 自分のトークンのみ参照可能
CREATE POLICY "Users can view own tokens"
ON google_tokens FOR SELECT
USING (user_id = auth.uid());

-- 自分のトークンのみ管理可能
CREATE POLICY "Users can manage own tokens"
ON google_tokens FOR ALL
USING (user_id = auth.uid());

-- ============================================
-- 20. audit_logs テーブル
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ADMIN以上のみ参照可能
CREATE POLICY "Admin can view audit_logs"
ON audit_logs FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- 挿入は全メンバー可能（ログ記録用）
CREATE POLICY "Members can create audit_logs"
ON audit_logs FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 21. pdca_cycles テーブル
-- ============================================
ALTER TABLE pdca_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pdca_cycles"
ON pdca_cycles FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can manage pdca_cycles"
ON pdca_cycles FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 22. Super Admin 用テーブル（SA専用）
-- ============================================

-- sa_metrics テーブル
ALTER TABLE sa_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SA can view metrics"
ON sa_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND account_type = 'SA'
  )
);

CREATE POLICY "SA can manage metrics"
ON sa_metrics FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND account_type = 'SA'
  )
);

-- sa_security_logs テーブル
ALTER TABLE sa_security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SA can view security_logs"
ON sa_security_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND account_type = 'SA'
  )
);

CREATE POLICY "SA can manage security_logs"
ON sa_security_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND account_type = 'SA'
  )
);
```

### 1.3 確認ポイント

- [ ] Supabase SQL Editor でマイグレーションを実行
- [ ] 各テーブルに `RLS enabled` が表示されることを確認
- [ ] Authentication → Policies で各ポリシーが表示されることを確認

---

## Step 2: CSP（Content Security Policy）の設定

### 2.1 セキュリティヘッダー設定ファイルの作成

**ファイル: `lib/security/headers.ts`**

```typescript
/**
 * lib/security/headers.ts
 *
 * Phase 20: セキュリティヘッダー設定
 */

export const securityHeaders = [
  // XSS 対策: ブラウザの XSS フィルターを有効化
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // クリックジャッキング対策: iframe での埋め込みを制限
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // MIME タイプスニッフィング対策
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Referrer 情報の制限
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // 権限ポリシー: 不要な機能を無効化
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: buildCSP(),
  },
];

/**
 * CSP ディレクティブを構築
 */
function buildCSP(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname : '';

  const directives = [
    // デフォルトは self のみ
    "default-src 'self'",

    // スクリプト: Next.js の動的機能に必要
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",

    // スタイル: インラインスタイルを許可（React の styled-components 等）
    "style-src 'self' 'unsafe-inline'",

    // 画像: data URI と https を許可
    "img-src 'self' data: https: blob:",

    // フォント: Google Fonts 等
    "font-src 'self' data: https://fonts.gstatic.com",

    // 接続先: Supabase と Google API
    `connect-src 'self' ${supabaseDomain ? `https://${supabaseDomain}` : ''} https://*.supabase.co https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com`,

    // フレーム: Google OAuth ポップアップ
    "frame-src 'self' https://accounts.google.com",

    // フォームの送信先
    "form-action 'self'",

    // ベース URI
    "base-uri 'self'",

    // object タグ等
    "object-src 'none'",
  ];

  return directives.join('; ');
}

/**
 * 開発環境用の緩和された CSP
 */
export function getCSPForEnvironment(): string {
  if (process.env.NODE_ENV === 'development') {
    // 開発環境では HMR 等のために緩和
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' ws: wss: https:",
      "font-src 'self' data: https:",
      "frame-src 'self' https:",
    ].join('; ');
  }
  return buildCSP();
}
```

### 2.2 next.config.ts の更新

**ファイル: `next.config.ts`**

```typescript
import type { NextConfig } from 'next';
import { securityHeaders } from './lib/security/headers';

const nextConfig: NextConfig = {
  // 既存の設定...

  // セキュリティヘッダーを追加
  async headers() {
    return [
      {
        // 全ルートに適用
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

### 2.3 確認ポイント

- [ ] `npm run dev` でエラーが出ないことを確認
- [ ] ブラウザの開発者ツール → Network → Response Headers で CSP が設定されていることを確認
- [ ] コンソールに CSP 違反のエラーが出ないことを確認

---

## Step 3: 入力サニタイズユーティリティの作成

### 3.1 サニタイズ関数の作成

**ファイル: `lib/security/sanitize.ts`**

```typescript
/**
 * lib/security/sanitize.ts
 *
 * Phase 20: 入力サニタイズユーティリティ
 */

/**
 * HTML 特殊文字をエスケープ
 * XSS 対策の基本
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
}

/**
 * SQL インジェクション対策用の文字列サニタイズ
 * ※ Supabase のパラメータ化クエリを使用する場合は不要
 * 　 念のための追加防御層として使用
 */
export function sanitizeSqlInput(str: string): string {
  // シングルクォートをエスケープ
  return str.replace(/'/g, "''");
}

/**
 * ファイル名のサニタイズ
 * パストラバーサル攻撃対策
 */
export function sanitizeFilename(filename: string): string {
  // 危険な文字を除去
  return filename
    .replace(/\.\./g, '') // ディレクトリトラバーサル
    .replace(/[/\\]/g, '') // パス区切り文字
    .replace(/[<>:"|?*]/g, '') // Windows で使えない文字
    .trim();
}

/**
 * URL のサニタイズ
 * オープンリダイレクト攻撃対策
 */
export function sanitizeRedirectUrl(url: string, allowedHosts: string[]): string | null {
  try {
    const parsed = new URL(url, 'https://example.com');

    // 相対パスの場合はそのまま許可
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }

    // 許可されたホストかチェック
    if (allowedHosts.includes(parsed.hostname)) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * ユーザー入力の一般的なサニタイズ
 * - 前後の空白を除去
 * - 制御文字を除去
 * - 長さを制限
 */
export function sanitizeUserInput(
  input: string,
  maxLength: number = 1000
): string {
  return input
    // 制御文字を除去（改行とタブは許可）
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // 前後の空白を除去
    .trim()
    // 長さを制限
    .slice(0, maxLength);
}

/**
 * メールアドレスのバリデーション
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * UUID のバリデーション
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

### 3.2 API ルートでの使用例

**ファイル: API ルートでの使用（例）**

```typescript
// app/api/workspaces/[workspaceId]/tasks/route.ts の POST 関数内

import { sanitizeUserInput, isValidUuid } from '@/lib/security/sanitize';

// ... 既存のコード ...

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { workspaceId } = await params;

  // UUID バリデーション
  if (!isValidUuid(workspaceId)) {
    return NextResponse.json({ error: 'Invalid workspace ID' }, { status: 400 });
  }

  const auth = await checkAuth(request, workspaceId);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();

  // 入力サニタイズ
  const sanitizedTitle = sanitizeUserInput(body.title, 200);
  const sanitizedDescription = body.description
    ? sanitizeUserInput(body.description, 2000)
    : null;

  // ... 以降の処理 ...
}
```

### 3.3 確認ポイント

- [ ] `lib/security/sanitize.ts` が作成されていること
- [ ] TypeScript の型エラーがないこと
- [ ] 必要な API ルートでサニタイズ関数を使用

---

## Step 4: レート制限の実装

### 4.1 レート制限ミドルウェアの作成

**ファイル: `lib/security/rate-limit.ts`**

```typescript
/**
 * lib/security/rate-limit.ts
 *
 * Phase 20: レート制限
 * インメモリ実装（本番環境では Redis 推奨）
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// インメモリストア（開発・小規模向け）
const rateLimitStore = new Map<string, RateLimitEntry>();

// 定期的にクリーンアップ
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // 1分ごと

export interface RateLimitConfig {
  maxRequests: number; // 期間内の最大リクエスト数
  windowMs: number;    // 期間（ミリ秒）
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * レート制限チェック
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // エントリがないか、期間が過ぎていたらリセット
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count <= config.maxRequests;

  return {
    success,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * 一般的なレート制限設定
 */
export const RATE_LIMITS = {
  // API 全般: 1分間に100リクエスト
  api: { maxRequests: 100, windowMs: 60 * 1000 },

  // ログイン試行: 5分間に5回
  login: { maxRequests: 5, windowMs: 5 * 60 * 1000 },

  // パスワードリセット: 1時間に3回
  passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 },

  // 招待送信: 1時間に20回
  invitation: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
} as const;
```

### 4.2 API ルートでのレート制限適用例

```typescript
// app/api/auth/callback/route.ts などで使用

import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  // IP アドレスを取得
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
    || request.headers.get('x-real-ip')
    || 'unknown';

  // レート制限チェック
  const rateLimitResult = checkRateLimit(`login:${ip}`, RATE_LIMITS.login);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      }
    );
  }

  // ... 以降の処理 ...
}
```

### 4.3 確認ポイント

- [ ] `lib/security/rate-limit.ts` が作成されていること
- [ ] 重要な API エンドポイントにレート制限を適用
- [ ] 429 レスポンスが正しく返されること

---

## Step 5: OWASP Top 10 対策チェックリスト

### 5.1 対策状況の確認

| # | 脆弱性 | 対策 | 状況 |
|---|--------|------|------|
| 1 | **Broken Access Control** | RLS + サーバーサイド認可 (`lib/server/api-auth.ts`) | ✅ |
| 2 | **Cryptographic Failures** | Supabase の暗号化 + HTTPS | ✅ |
| 3 | **Injection** | パラメータ化クエリ + 入力サニタイズ | ✅ |
| 4 | **Insecure Design** | 認可チェックの一元化 | ✅ |
| 5 | **Security Misconfiguration** | CSP + セキュリティヘッダー | ✅ |
| 6 | **Vulnerable Components** | npm audit + 依存関係の更新 | 要確認 |
| 7 | **Authentication Failures** | Supabase Auth + レート制限 | ✅ |
| 8 | **Data Integrity Failures** | 入力バリデーション (Zod) | ✅ |
| 9 | **Security Logging** | audit_logs テーブル | ✅ |
| 10 | **SSRF** | URL サニタイズ | ✅ |

### 5.2 脆弱な依存関係のチェック

```bash
# 脆弱性チェック
npm audit

# 脆弱性の自動修正（安全な場合）
npm audit fix

# 依存関係の更新
npm update
```

### 5.3 確認ポイント

- [ ] `npm audit` で重大な脆弱性がないこと
- [ ] 全ての対策が実装されていること

---

## Step 6: 環境変数のセキュリティ確認

### 6.1 機密情報の管理

**確認項目：**

```bash
# .env.local が .gitignore に含まれていることを確認
cat .gitignore | grep ".env"

# 機密情報がコミットされていないことを確認
git log --all --full-history -- "*.env*"
```

### 6.2 本番環境の環境変数

**Vercel に設定すべき環境変数：**

| 変数名 | 説明 | 公開 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスキー | **No** |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth シークレット | **No** |

### 6.3 確認ポイント

- [ ] `.env.local` が Git に含まれていないこと
- [ ] 機密キーが `NEXT_PUBLIC_` プレフィックスを使っていないこと
- [ ] Vercel の環境変数が正しく設定されていること

---

## 完了チェックリスト

### RLS 設定
- [ ] `supabase/migrations/20240120000001_enable_rls.sql` を作成
- [ ] Supabase で RLS マイグレーションを実行
- [ ] 各テーブルに RLS が有効化されていることを確認

### CSP 設定
- [ ] `lib/security/headers.ts` を作成
- [ ] `next.config.ts` にセキュリティヘッダーを追加
- [ ] ブラウザで CSP ヘッダーが設定されていることを確認

### 入力サニタイズ
- [ ] `lib/security/sanitize.ts` を作成
- [ ] 主要な API ルートでサニタイズを適用

### レート制限
- [ ] `lib/security/rate-limit.ts` を作成
- [ ] ログイン・招待等の重要エンドポイントに適用

### OWASP 対策
- [ ] 全10項目の対策を確認
- [ ] `npm audit` で重大な脆弱性がないこと

### 環境変数
- [ ] 機密情報が適切に管理されていること
- [ ] 本番環境の環境変数が設定されていること

### ビルド・デプロイ
- [ ] `npm run build` が成功すること
- [ ] Vercel にデプロイして動作確認

---

## 次のステップ

Phase 20 が完了したら、以下を検討：

1. **Phase 21**: パフォーマンス最適化（キャッシュ、バンドルサイズ削減）
2. **Phase 22**: テスト実装（Jest、Playwright）
3. **Phase 23**: CI/CD パイプライン（GitHub Actions）

---

## 参考リンク

- [Supabase RLS ドキュメント](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js セキュリティヘッダー](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSP 入門](https://developer.mozilla.org/ja/docs/Web/HTTP/CSP)
