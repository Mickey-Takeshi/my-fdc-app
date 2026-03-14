# Next.js 15 → 16 移行ガイド（既存プロジェクト向け）

> **対象**: fdc-modular-starter を Next.js 15 時代に clone して開発を進めている方
> **所要時間**: Claude Code に依頼すれば 2〜3 分

---

## Claude Code に依頼（推奨）

以下をそのまま Claude Code に送信してください:

```
このプロジェクトを Next.js 16.0.10 に移行して。

手順:
1. npm install next@16.0.10 eslint-config-next@16.0.10 --save-exact
2. package.json の lint スクリプトを "eslint ." に変更
3. package.json の description の "Next.js 15" を "Next.js 16" に
4. middleware.ts を proxy.ts にリネームし、関数名も proxy に変更
5. .eslintrc.json があれば eslint.config.mjs に移行（ESLint 9 flat config）
6. next.config.ts のコメントで "Next.js 15" → "Next.js 16"
7. CLAUDE.md の技術スタックを "Next.js 16.0.10" に更新
8. params / searchParams を使っている Server Component があれば await 化
9. npm run lint && npm run type-check && npm run build で検証

最後に変更ファイル一覧と検証結果を報告して。
```

---

## 手動で行う場合

### 1. 依存関係更新

```bash
npm install next@16.0.10 eslint-config-next@16.0.10 --save-exact
```

### 2. package.json

```diff
- "description": "... (Next.js 15 + React 19)",
+ "description": "... (Next.js 16 + React 19)",

- "lint": "next lint",
+ "lint": "eslint .",
```

### 3. middleware.ts → proxy.ts

```bash
git mv middleware.ts proxy.ts
```

proxy.ts 内:
```diff
- export function middleware(request: NextRequest) {
+ export function proxy(request: NextRequest) {
```

### 4. ESLint 設定（ESLint 9 対応）

`.eslintrc.json` を削除し、`eslint.config.mjs` を作成:

```javascript
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_"
    }],
  },
}, {
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "references/**",
  ]
}];

export default eslintConfig;
```

### 5. params / searchParams の非同期化

Server Component で `params` や `searchParams` を使っている場合:

```diff
- export default function Page({ params }: { params: { slug: string } }) {
-   const { slug } = params;
+ export default async function Page({
+   params
+ }: {
+   params: Promise<{ slug: string }>
+ }) {
+   const { slug } = await params;
```

Client Component（`'use client'`）は変更不要です。

### 6. 検証

```bash
npm run lint
npm run type-check
npm run build
```

---

## よくある質問

**Q: Phase 1〜3 をすでに進めています。移行しても大丈夫ですか？**
A: はい。移行は依存関係とファイル名の変更だけです。自分で書いたコードのロジックは変わりません。`params` / `searchParams` を使った Server Component があれば `await` を追加するだけです。

**Q: Client Component も修正が必要ですか？**
A: いいえ。`'use client'` のコンポーネントでは `useParams()` / `useSearchParams()` は従来通り同期的に動作します。

**Q: 移行しないとどうなりますか？**
A: Next.js 15 のまま開発を続けることは可能です。ただし Workshop の教材は Next.js 16 前提で記述されているため、コマンドやファイル名が異なる場面があります。

---

**Last Updated**: 2026-02-22
