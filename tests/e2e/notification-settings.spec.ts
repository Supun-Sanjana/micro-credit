import { test, expect } from '@playwright/test';

test.describe('Notification Settings UI', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/app/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
  });


  test('Page loads correctly', async ({ page }) => {
    await page.goto('/app/settings/notifications');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1', { hasText: 'Notification Settings' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    const eventTypes = [
      'LOAN APPROVED',
      'LOAN DISBURSED',
      'LOAN SETTLED',
      'PAYMENT RECEIVED',
      'PAYMENT OVERDUE',
      'DOCUMENT REJECTED'
    ];

    for (const eventType of eventTypes) {
      await expect(page.locator('tr', { hasText: eventType })).toBeVisible();
    }

    await expect(page.locator('button', { hasText: 'Save Preferences' })).toBeVisible();
  });


  test('Toggle disables email input', async ({ page }) => {
    await page.goto('/app/settings/notifications');
    await page.waitForLoadState('networkidle');

    const row = page.locator('tr', { hasText: 'LOAN APPROVED' });
    const checkbox = row.locator('input[type="checkbox"]');
    const emailInput = row.locator('input[placeholder="Defaults to account email"]');

    // Ensure checked to start
    await checkbox.check();
    await expect(emailInput).toBeEnabled();

    // Uncheck — input should disable
    await checkbox.uncheck();
    await expect(emailInput).toBeDisabled();

    // Re-check — input should re-enable
    await checkbox.check();
    await expect(emailInput).toBeEnabled();
  });

  test('Save preferences with custom email', async ({ page }) => {
    await page.goto('/app/settings/notifications');
    await page.waitForLoadState('networkidle');

    const row = page.locator('tr', { hasText: 'LOAN APPROVED' });
    const checkbox = row.locator('input[type="checkbox"]');
    const emailInput = row.locator('input[placeholder="Defaults to account email"]');

    await checkbox.check();
    await emailInput.fill('test-override@example.com');
    await page.locator('button', { hasText: 'Save Preferences' }).click();

    await expect(page.getByText('Preferences saved successfully')).toBeVisible({ timeout: 10000 });
  });

  test('Invalid email shows error', async ({ page }) => {
    await page.goto('/app/settings/notifications');
    await page.waitForLoadState('networkidle');

    const row = page.locator('tr', { hasText: 'LOAN DISBURSED' });
    const checkbox = row.locator('input[type="checkbox"]');
    const emailInput = row.locator('input[placeholder="Defaults to account email"]');

    await checkbox.check();
    await emailInput.fill('not-an-email');
    await page.locator('button', { hasText: 'Save Preferences' }).click();

    await expect(
      page.locator('text=/[Ii]nvalid email/').or(page.locator('text=/[Ff]ailed to save/'))
    ).toBeVisible({ timeout: 10000 });
  });
  
  test('Settings link appears in sidebar', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    
    const sidebar = page.locator('aside');
    await expect(sidebar.locator('text="Notifications"').or(sidebar.locator('a[href="/app/settings/notifications"]'))).toBeVisible();
  });
});
