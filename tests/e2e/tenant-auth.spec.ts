import { test, expect } from '@playwright/test';

test.describe('Tenant Authentication', () => {
  test.setTimeout(60000);

  test('login with correct credentials redirects to /dashboard', async ({ page }) => {
    await page.goto('/app/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL('/app/dashboard', { timeout: 15000 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('login with wrong password stays on /login and shows error', async ({ page }) => {
    await page.goto('/app/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/app/login', { timeout: 15000 });
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 15000 });
  });
});
