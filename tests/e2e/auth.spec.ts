import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');

    // Google ログインボタンの確認
    await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
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
