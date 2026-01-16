import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');

    // ページ読み込みを待機
    await page.waitForLoadState('networkidle');

    // ログインページが表示されることを確認（Supabase/Mockモード両対応）
    // Google ボタン または デモログインボタン のいずれかが表示される
    const googleButton = page.getByRole('button', { name: /Google/ });
    const demoButton = page.getByRole('button', { name: /デモログイン/ });

    const hasGoogleButton = await googleButton.isVisible().catch(() => false);
    const hasDemoButton = await demoButton.isVisible().catch(() => false);

    expect(hasGoogleButton || hasDemoButton).toBe(true);
  });

  test('未認証ユーザーはダッシュボードにアクセスできない', async ({ page }) => {
    await page.goto('/dashboard');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/login/);
  });

  test('未認証ユーザーはタスクページにアクセスできない', async ({ page }) => {
    await page.goto('/tasks');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/login/);
  });
});
