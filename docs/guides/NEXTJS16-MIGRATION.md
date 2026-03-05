# Next.js 16 Migration Guide

> Next.js 15 から Next.js 16 への移行に必要な全変更点と対応手順

---

## 1. なぜ移行するか

### Turbopack がデフォルトに

Next.js 16 では Turbopack がデフォルトのバンドラーとなった。
webpack と比較して開発サーバーの起動・HMR（Hot Module Replacement）が大幅に高速化される。

### セキュリティ修正（CVE-2025-55182）

Next.js 15.x 系に存在したセキュリティ脆弱性（CVE-2025-55182: Server-Side Request Forgery）が
Next.js 16 で修正されている。本番運用するプロジェクトは移行を推奨する。

### パフォーマンス改善

- ビルド時間の短縮（Turbopack による並列処理）
- 開発サーバーの起動速度向上
- メモリ使用量の削減
- React 19.2.x の最新最適化を活用

---

## 2. 移行チェックリスト

| # | 項目 | 必須 | 状態 |
|---|------|------|------|
| 1 | `middleware.ts` を `proxy.ts` にリネーム | Yes | - |
| 2 | `params` / `searchParams` の `await` 化 | Yes | - |
| 3 | `cookies()` / `headers()` の `await` 化 | Yes | - |
| 4 | 重複ファイルの検出と解消 | Yes | - |
| 5 | ESLint 設定の移行（`next lint` -> `eslint .`） | Yes | - |
| 6 | React 19.2.1 以上であることを確認 | Yes | - |

---

## 3. middleware.ts から proxy.ts へのリネーム

Next.js 16 では `middleware.ts` が `proxy.ts` にリネームされた。
関数名も `middleware` から `proxy` に変更する必要がある。

### 手順

```bash
git mv middleware.ts proxy.ts
```

### コード変更

変更前（Next.js 15: `middleware.ts`）:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ... ロジック
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

変更後（Next.js 16: `proxy.ts`）:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // ... ロジック（変更なし）
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

変更点:
- ファイル名: `middleware.ts` -> `proxy.ts`
- 関数名: `middleware` -> `proxy`
- `config` オブジェクトは変更なし

---

## 4. params / searchParams の非同期化

Next.js 16 では Server Component の `params` と `searchParams` が `Promise` を返すようになった。

### Server Component での変更

変更前（Next.js 15）:

```typescript
// app/leads/[id]/page.tsx
export default function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  // ...
}
```

変更後（Next.js 16）:

```typescript
// app/leads/[id]/page.tsx
export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ...
}
```

### searchParams も同様

変更前:

```typescript
export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q;
}
```

変更後:

```typescript
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query } = await searchParams;
}
```

### Client Component は変更不要

`'use client'` ディレクティブを持つコンポーネントでは、
`useParams()` と `useSearchParams()` は従来通り同期的に動作する。変更は不要。

```typescript
'use client';

import { useParams } from 'next/navigation';

export default function ClientComponent() {
  const params = useParams(); // 同期的。変更不要
  // ...
}
```

---

## 5. cookies() / headers() の非同期化

Next.js 16 では `cookies()` と `headers()` も非同期関数になった。

### 変更前

```typescript
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('token');
}
```

### 変更後

```typescript
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
}
```

`headers()` も同様に `await` が必要:

```typescript
import { headers } from 'next/headers';

export async function GET() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
}
```

---

## 6. Turbopack ファイル優先順位の問題

Turbopack では同名ファイルの解決ルールが webpack と異なる。
以下のケースでビルドエラーや予期しない動作が発生する可能性がある。

### 問題パターン 1: index.ts と index.tsx の共存

```
lib/types/
  index.ts      <-- Turbopack はこちらを優先
  index.tsx     <-- 無視される可能性あり
```

**対処法**: 同一ディレクトリに `index.ts` と `index.tsx` を共存させない。
型定義のみなら `.ts`、JSX を含むなら `.tsx` に統一する。

### 問題パターン 2: Component.tsx と Component/index.tsx

```
components/
  Button.tsx           <-- 競合
  Button/
    index.tsx          <-- 競合
```

**対処法**: どちらか一方に統一する。
小さなコンポーネントはフラットファイル（`Button.tsx`）、
複数ファイルで構成されるコンポーネントはディレクトリ（`Button/index.tsx`）を使う。

### 重複ファイル検出コマンド

以下のスクリプトで重複を検出できる:

```bash
# index.ts と index.tsx の共存を検出
find . -name "index.ts" -not -path "*/node_modules/*" | while read f; do
  dir=$(dirname "$f")
  if [ -f "$dir/index.tsx" ]; then
    echo "CONFLICT: $dir has both index.ts and index.tsx"
  fi
done

# Component.tsx と Component/index.tsx の共存を検出
find . -name "*.tsx" -not -path "*/node_modules/*" -not -name "index.tsx" | while read f; do
  base=$(basename "$f" .tsx)
  dir=$(dirname "$f")
  if [ -d "$dir/$base" ] && [ -f "$dir/$base/index.tsx" ]; then
    echo "CONFLICT: $dir/$base.tsx and $dir/$base/index.tsx"
  fi
done
```

---

## 7. pino と Turbopack の互換性

`pino` ロガーは Node.js ネイティブモジュールに依存しているため、
Turbopack のバンドル対象から除外する必要がある。

### next.config.ts の設定

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ['pino'],
  // ...
};
```

この設定により、`pino` はサーバーサイドでのみ実行され、
Turbopack のバンドル処理をスキップする。

設定がない場合、以下のエラーが発生する可能性がある:
- `Module not found: Can't resolve 'pino-pretty'`
- `Cannot use import statement outside a module`

---

## 8. ESLint の変更

Next.js 16 では ESLint の実行方法が変更された。

### lint コマンドの変更

```diff
// package.json
{
  "scripts": {
-   "lint": "next lint",
+   "lint": "eslint ."
  }
}
```

### ESLint 設定ファイル

Next.js 16 は ESLint 9 の Flat Config を推奨する。
`.eslintrc.json` を使用している場合は `eslint.config.mjs` に移行する。

```javascript
// eslint.config.mjs
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
    ],
  },
];

export default eslintConfig;
```

---

## 9. 移行ステップまとめ

### Step 1: 依存関係の更新

```bash
npm install next@latest eslint-config-next@latest
```

React が 19.2.1 以上であることを確認:

```bash
npm ls react
```

### Step 2: proxy.ts のリネーム

```bash
git mv middleware.ts proxy.ts
# proxy.ts 内の関数名を middleware -> proxy に変更
```

### Step 3: 非同期 API の対応

- Server Component の `params` / `searchParams` に `await` を追加
- `cookies()` / `headers()` に `await` を追加

### Step 4: 重複ファイルの解消

セクション 6 の検出スクリプトを実行し、競合を解消する。

### Step 5: ESLint 設定の移行

- `package.json` の lint スクリプトを `eslint .` に変更
- `.eslintrc.json` を `eslint.config.mjs` に移行

### Step 6: next.config.ts の更新

- `serverExternalPackages` に `pino` を追加（使用している場合）

### Step 7: 検証

```bash
npm run lint
npm run type-check
npm run build
```

---

## 10. トラブルシューティング

| 問題 | 原因 | 解決策 |
|------|------|--------|
| `middleware is not a function` | proxy.ts への移行が不完全 | ファイル名を `proxy.ts` にし、関数名を `proxy` に変更する |
| `params is not iterable` | Server Component で params を await していない | `params: Promise<{ id: string }>` にして `await params` する |
| `cookies is not a function` | cookies() を await していない | `const cookieStore = await cookies()` に変更する |
| `Module not found: pino-pretty` | pino が Turbopack でバンドルされている | `next.config.ts` に `serverExternalPackages: ['pino']` を追加 |
| `Duplicate module` ビルドエラー | index.ts と index.tsx の共存 | 重複ファイル検出スクリプトで検出し、どちらかを削除する |
| `next lint` が動作しない | Next.js 16 では非推奨 | `eslint .` に変更し、`eslint.config.mjs` を使用する |

---

**Last Updated**: 2026-03-05
**Version**: v46.0.0
