import { test, expect } from '@playwright/test';

test.describe('Admin Flows', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/app/admin/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'super@steep.local');
    await page.fill('input[name="password"]', 'supersecret123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/admin', { timeout: 15000 });
  });

  test('admin dashboard loads /admin', async ({ page }) => {
    await page.goto('/app/admin');
    await expect(page).toHaveURL('/app/admin', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('orgs list loads /admin/orgs', async ({ page }) => {
    await page.goto('/app/admin/orgs');
    await expect(page).toHaveURL('/app/admin/orgs', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('claims list loads /admin/claims', async ({ page }) => {
    await page.goto('/app/admin/claims');
    await expect(page).toHaveURL('/app/admin/claims', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('plans list loads /admin/plans', async ({ page }) => {
    await page.goto('/app/admin/plans');
    await expect(page).toHaveURL('/app/admin/plans', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('audit logs load /admin/audit-logs', async ({ page }) => {
    await page.goto('/app/admin/audit-logs');
    await expect(page).toHaveURL('/app/admin/audit-logs', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });
});
