import { test, expect } from '@playwright/test';

test.describe('Tenant Flows', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('dashboard page loads /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('members list page loads /members', async ({ page }) => {
    await page.goto('/members');
    await expect(page).toHaveURL('/members', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('loans list page loads /loans', async ({ page }) => {
    await page.goto('/loans');
    await expect(page).toHaveURL('/loans', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('branches page loads /branches', async ({ page }) => {
    await page.goto('/branches');
    await expect(page).toHaveURL('/branches', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('centres page loads /centres', async ({ page }) => {
    await page.goto('/centres');
    await expect(page).toHaveURL('/centres', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('collection page loads /collection', async ({ page }) => {
    await page.goto('/collection');
    await expect(page).toHaveURL('/collection', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('reports page loads /reports', async ({ page }) => {
    await page.goto('/reports');
    await expect(page).toHaveURL('/reports', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('settings/billing page loads /settings/billing', async ({ page }) => {
    await page.goto('/settings/billing');
    await expect(page).toHaveURL('/settings/billing', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });
});
