import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Supabase/Mockモード両対応
    const googleButton = page.getByRole('button', { name: /Google/ });
    const demoButton = page.getByRole('button', { name: /デモログイン/ });

    const hasGoogleButton = await googleButton.isVisible().catch(() => false);
    const hasDemoButton = await demoButton.isVisible().catch(() => false);

    expect(hasGoogleButton || hasDemoButton).toBe(true);
  });

  test('未認証ユーザーはダッシュボードにアクセスできない', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('未認証ユーザーはタスクページにアクセスできない', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page).toHaveURL(/login/);
  });
});
