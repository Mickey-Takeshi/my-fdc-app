import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
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
