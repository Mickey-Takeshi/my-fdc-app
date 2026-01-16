import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  // CIではベースラインスナップショットがないためスキップ
  test.skip(!!process.env.CI, 'VRTはローカルでベースライン作成後に有効化');

  test('ログインページのスナップショット', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});
