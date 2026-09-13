import { test, expect } from '@playwright/test';

test.describe('Tenant Flows', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/app/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('dashboard page loads /dashboard', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page).toHaveURL('/app/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('members list page loads /members', async ({ page }) => {
    await page.goto('/app/members');
    await expect(page).toHaveURL('/app/members', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('loans list page loads /loans', async ({ page }) => {
    await page.goto('/app/loans');
    await expect(page).toHaveURL('/app/loans', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('branches page loads /branches', async ({ page }) => {
    await page.goto('/app/branches');
    await expect(page).toHaveURL('/app/branches', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('centres page loads /centres', async ({ page }) => {
    await page.goto('/app/centres');
    await expect(page).toHaveURL('/app/centres', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('collection page loads /collection', async ({ page }) => {
    await page.goto('/app/collection');
    await expect(page).toHaveURL('/app/collection', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('reports page loads /reports', async ({ page }) => {
    await page.goto('/app/reports');
    await expect(page).toHaveURL('/app/reports', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('settings/billing page loads /settings/billing', async ({ page }) => {
    await page.goto('/app/settings/billing');
    await expect(page).toHaveURL('/app/settings/billing', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });
});
