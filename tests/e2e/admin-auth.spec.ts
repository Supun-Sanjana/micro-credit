import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test.setTimeout(60000);

  test('admin login with correct creds redirects to /admin', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"]', 'super@steep.local');
    await page.fill('input[name="password"]', 'supersecret123');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/admin', { timeout: 15000 });
    await expect(page).toHaveURL('/admin', { timeout: 15000 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('admin login with wrong password stays on /admin/login and shows error', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"]', 'super@steep.local');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 });
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 15000 });
  });
});
