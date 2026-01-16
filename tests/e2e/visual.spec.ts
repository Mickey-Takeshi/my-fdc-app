import { test, expect } from '@playwright/test';

// CI環境では初回スナップショット作成のためスキップ
// ローカルで npm run test:visual:update を実行してスナップショットを作成後、
// tests/e2e/visual.spec.ts-snapshots/ をコミットする
test.describe('Visual Regression Tests', () => {
  // スナップショットが存在しない場合は自動的にスキップ
  test.skip(!!process.env.CI, 'VRTはローカルでベースライン作成後に有効化');

  test('ログインページのスナップショット', async ({ page }) => {
    await page.goto('/login');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // ページ全体のスクリーンショット
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});
