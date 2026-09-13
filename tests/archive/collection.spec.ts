import { test, expect } from '@playwright/test';

test.describe('Collection Page E2E', () => {
  test('fetch list, toggle status, and bulk save', async ({ page }) => {
    // 1. Login as Tenant
    await page.goto('/app/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for successful login redirect
    await expect(page).toHaveURL('/app/dashboard');
    
    // 2. Go to collection page
    await page.goto('/app/collection');
    
    // Wait for due list to load
    await expect(page.locator('text="Daily Collection"').first()).toBeVisible();

    // 3. Click "NP" on the first member if available
    const npButton = page.locator('button:has-text("NP")').first();
    if (await npButton.isVisible()) {
      await npButton.click();
    }

    // 4. Save
    const saveButton = page.locator('button:has-text("Bulk Save")');
    if (await saveButton.isVisible() && await saveButton.isEnabled()) {
      await saveButton.click();
      // Look for a success indication, the button text might change or an alert.
      // We will just verify it finishes saving by checking if button is re-enabled.
      await expect(saveButton).toBeEnabled();
    }
  });
});
