# Phase 21: テスト実装ランブック

**Phase 21: ユニットテスト・E2Eテスト・VRT・構造化ログ・CI/CD統合**

---

## 0. 前提条件

- [ ] Phase 20 完了（セキュリティ強化）
- [ ] Node.js 18以上（推奨: >=22.22.0）
- [ ] Next.js 15 + React 19 環境

---

## 1. 必読ドキュメント

| ドキュメント | パス | 目的 |
|------------|------|------|
| グランドガイド | references/saas-docs/FDC-GRAND-GUIDE.md | プロジェクト全体像・設計思想 |
| 開発ガイド | references/saas-docs/guides/DEVELOPMENT.md | 技術詳細・コーディング規約 |

---

## 2. テストの種類と使い分け

| テスト種類 | ツール | 目的 | 実行頻度 |
|-----------|--------|------|---------|
| ユニットテスト | Vitest | 関数・ロジックの検証 | 毎コミット |
| E2Eテスト | Playwright | ユーザーフロー全体 | 毎プッシュ/PR |
| VRT | Playwright | 見た目の変更検出 | PR時 |

---

## Step 1: ユニットテスト（Vitest）セットアップ

### 1.1 パッケージインストール

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

### 1.2 設定ファイル作成

**ファイル: `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'tests/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '.next/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### 1.3 テストセットアップファイル

**ファイル: `tests/setup.ts`**

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// グローバルモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// fetch モック（必要に応じて）
global.fetch = vi.fn();
```

### 1.4 package.json にスクリプト追加

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:coverage": "vitest run --coverage"
  }
}
```

### 1.5 ユニットテストの例

**ファイル: `tests/unit/lib/security/sanitize.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeFilename,
  sanitizeUserInput,
  isValidEmail,
  isValidUuid,
} from '@/lib/security/sanitize';

describe('escapeHtml', () => {
  it('HTML特殊文字をエスケープする', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('通常の文字はそのまま返す', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('sanitizeFilename', () => {
  it('パストラバーサル文字を除去する', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
  });

  it('Windows禁止文字を除去する', () => {
    expect(sanitizeFilename('file<>:"|?*.txt')).toBe('file.txt');
  });
});

describe('sanitizeUserInput', () => {
  it('制御文字を除去する', () => {
    expect(sanitizeUserInput('hello\x00world')).toBe('helloworld');
  });

  it('長さを制限する', () => {
    const longString = 'a'.repeat(2000);
    expect(sanitizeUserInput(longString, 100).length).toBe(100);
  });

  it('前後の空白を除去する', () => {
    expect(sanitizeUserInput('  hello  ')).toBe('hello');
  });
});

describe('isValidEmail', () => {
  it('有効なメールアドレスを検証する', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name+tag@domain.co.jp')).toBe(true);
  });

  it('無効なメールアドレスを拒否する', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
  });
});

describe('isValidUuid', () => {
  it('有効なUUIDを検証する', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('無効なUUIDを拒否する', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
  });
});
```

### 1.6 確認ポイント

- [ ] `npm run test:unit` でテストが実行できること
- [ ] `npm run test:unit:coverage` でカバレッジレポートが生成されること
- [ ] TypeScript の型エラーがないこと

---

## Step 2: E2Eテスト（Playwright）セットアップ

### 2.1 Playwright インストール

```bash
npm init playwright@latest
# TypeScript: Yes
# tests folder: tests/e2e
# GitHub Actions: Yes
# Install browsers: Yes
```

### 2.2 設定ファイル

**ファイル: `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 2.3 E2Eテストの作成

**ファイル: `tests/e2e/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');

    // ページタイトルの確認
    await expect(page).toHaveTitle(/FDC|ログイン/);

    // Google ログインボタンの確認
    await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
  });

  test('未認証ユーザーはダッシュボードにアクセスできない', async ({ page }) => {
    await page.goto('/dashboard');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/login/);
  });
});
```

**ファイル: `tests/e2e/dashboard.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('ダッシュボード', () => {
  // 認証済みセッションを使用する場合は beforeEach で設定
  test.beforeEach(async ({ page }) => {
    // テスト用の認証セッションをセットアップ
    // 実際の実装ではテスト用Cookieを設定するか、
    // テスト用の認証エンドポイントを使用
  });

  test('ダッシュボードページが正しく表示される', async ({ page }) => {
    await page.goto('/dashboard');

    // 主要な UI 要素の確認
    await expect(page.locator('nav')).toBeVisible();
  });
});
```

**ファイル: `tests/e2e/tasks.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('タスク管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('タスク一覧が表示される', async ({ page }) => {
    // タスクページの基本的な構造を確認
    await expect(page.locator('main')).toBeVisible();
  });

  test('新しいタスクを作成できる', async ({ page }) => {
    // タスク作成フローのテスト
    const addButton = page.getByRole('button', { name: /追加|新規|作成/ });

    if (await addButton.isVisible()) {
      await addButton.click();

      // モーダルまたはフォームが表示されることを確認
      await expect(page.getByRole('dialog').or(page.getByRole('form'))).toBeVisible();
    }
  });
});
```

### 2.4 package.json にスクリプト追加

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### 2.5 確認ポイント

- [ ] `npx playwright test` でテストが実行できること
- [ ] `npx playwright show-report` でレポートが表示されること
- [ ] 全ブラウザでテストが通ること

---

## Step 3: Visual Regression Test（VRT）

### 3.1 VRTテストの作成

**ファイル: `tests/e2e/visual.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('ログインページのスナップショット', async ({ page }) => {
    await page.goto('/login');

    // ページ全体のスクリーンショット
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01, // 1%までの差分を許容
    });
  });

  test('ダッシュボードのスナップショット', async ({ page }) => {
    await page.goto('/dashboard');

    // ネットワークが安定するまで待機
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixels: 100, // 100ピクセルまでの差分を許容
    });
  });

  test('タスクページのスナップショット', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('tasks-page.png', {
      fullPage: true,
    });
  });
});
```

### 3.2 スナップショット管理

```bash
# 初回実行（ベースライン作成）
npx playwright test tests/e2e/visual.spec.ts --update-snapshots

# 通常実行（差分検出）
npx playwright test tests/e2e/visual.spec.ts

# 差分があった場合の更新
npx playwright test tests/e2e/visual.spec.ts --update-snapshots
```

### 3.3 package.json にスクリプト追加

```json
{
  "scripts": {
    "test:visual": "playwright test tests/e2e/visual.spec.ts",
    "test:visual:update": "playwright test tests/e2e/visual.spec.ts --update-snapshots"
  }
}
```

### 3.4 確認ポイント

- [ ] スナップショットが `tests/e2e/visual.spec.ts-snapshots/` に保存されること
- [ ] UI変更時に差分が検出されること
- [ ] `--update-snapshots` で更新できること

---

## Step 4: 構造化ログ（Pino）

### 4.1 パッケージインストール

```bash
npm install pino
npm install -D pino-pretty
```

### 4.2 ロガー作成

**ファイル: `lib/server/logger.ts`**

```typescript
/**
 * lib/server/logger.ts
 *
 * Phase 21: 構造化ログ
 */

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  // 本番環境では JSON 形式、開発環境では読みやすい形式
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
});

/**
 * リクエストID付きロガーを作成
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

/**
 * ワークスペースコンテキスト付きロガーを作成
 */
export function createWorkspaceLogger(workspaceId: string, userId: string) {
  return logger.child({ workspaceId, userId });
}

/**
 * PII（個人情報）をマスクする
 */
export function maskPII(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['email', 'password', 'token', 'accessToken', 'refreshToken'];
  const masked = { ...data };

  for (const key of sensitiveKeys) {
    if (key in masked) {
      masked[key] = '***MASKED***';
    }
  }

  return masked;
}
```

### 4.3 APIでの使用例

**ファイル: API ルートでの使用例**

```typescript
// app/api/workspaces/[workspaceId]/tasks/route.ts
import { logger, createRequestLogger } from '@/lib/server/logger';

export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);

  log.info({ path: request.url }, 'Request received');

  try {
    const { workspaceId } = await params;

    // 認証チェック
    const auth = await checkAuth(request, workspaceId);
    if (isAuthError(auth)) {
      log.warn({ error: auth.error }, 'Authentication failed');
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // データ取得
    const { data, error } = await auth.supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) {
      log.error({ error: error.message }, 'Database query failed');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    log.info({ count: data?.length ?? 0 }, 'Tasks fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    log.error({ error }, 'Unexpected error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4.4 確認ポイント

- [ ] 開発環境で色付きログが表示されること
- [ ] 本番環境で JSON 形式のログが出力されること
- [ ] PII がマスクされていること

---

## Step 5: CI/CD統合（GitHub Actions）

### 5.1 ワークフロー作成

**ファイル: `.github/workflows/test.yml`**

```yaml
name: Test

on:
  push:
    branches: [main, elegant-wu]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'

jobs:
  # 型チェック・Lint
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

  # ユニットテスト
  unit-test:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/

  # E2Eテスト
  e2e-test:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Run E2E tests
        run: npx playwright test --project=chromium
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  # VRTテスト（PRのみ）
  visual-test:
    runs-on: ubuntu-latest
    needs: quality
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Run visual tests
        run: npm run test:visual

      - name: Upload visual diff
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-diff
          path: test-results/
```

### 5.2 確認ポイント

- [ ] `.github/workflows/test.yml` が作成されていること
- [ ] GitHub で Actions が実行されること
- [ ] 全 job が成功すること

---

## Step 6: package.json 最終更新

### 6.1 全スクリプトの統合

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:visual": "playwright test tests/e2e/visual.spec.ts",
    "test:visual:update": "playwright test tests/e2e/visual.spec.ts --update-snapshots",
    "test": "npm run test:unit && npm run test:e2e"
  }
}
```

---

## 完了チェックリスト

### ユニットテスト（Vitest）
- [ ] `vitest.config.ts` を作成
- [ ] `tests/setup.ts` を作成
- [ ] `tests/unit/` にテストファイルを作成
- [ ] `npm run test:unit` が成功すること

### E2Eテスト（Playwright）
- [ ] `playwright.config.ts` を作成
- [ ] `tests/e2e/` にテストファイルを作成
- [ ] `npm run test:e2e` が成功すること

### VRT
- [ ] `tests/e2e/visual.spec.ts` を作成
- [ ] スナップショットを生成
- [ ] `npm run test:visual` が成功すること

### 構造化ログ
- [ ] `lib/server/logger.ts` を作成
- [ ] 主要な API でログを出力

### CI/CD
- [ ] `.github/workflows/test.yml` を作成
- [ ] GitHub Actions が成功すること

### ビルド・デプロイ
- [ ] `npm run build` が成功すること
- [ ] Vercel にデプロイして動作確認

---

## 実装ルール

1. **ログには個人情報を含めない** - `maskPII()` を使用
2. **E2Eテストは独立して実行可能に** - テスト間の依存を避ける
3. **スナップショットはOS/ブラウザ別に管理** - CI環境に合わせる
4. **CI/CDで失敗したらマージしない** - 品質ゲートを維持

---

## 参考リンク

- [Vitest ドキュメント](https://vitest.dev/)
- [Playwright ドキュメント](https://playwright.dev/)
- [Pino ドキュメント](https://getpino.io/)
- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)

---

**Last Updated**: 2026-01-16
**Phase**: 21
**Status**: Ready for Implementation
