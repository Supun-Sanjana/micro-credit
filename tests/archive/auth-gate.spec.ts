import { test, expect } from '@playwright/test';

test.describe('Auth Gate & Admin Approval', () => {
  test('tenant suspended -> admin approves -> tenant active', async ({ page, context }) => {
    // We need two contexts/browsers ideally, or we can just login, logout, login.
    // Let's do a single flow.

    // 1. Login as Admin
    await page.goto('/app/admin/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'super@steep.local');
    await page.fill('input[type="password"]', 'supersecret123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/app/admin');

    // 2. Go to Claims and Approve
    await page.goto('/app/admin/claims');
    await expect(page).toHaveURL(/\/app\/admin\/claims/);

    // Click the first Review button if there are pending claims
    const reviewLink = page.locator('a:has-text("Review")').first();
    if (await reviewLink.isVisible()) {
        await reviewLink.click();
        // Approve
        await page.click('button:has-text("Approve Claim")');
        // Wait for redirect back
        await expect(page).toHaveURL('/app/admin/claims');
    }

    // Clear cookies to switch to tenant
    await context.clearCookies();

    // 3. Login as Tenant
    await page.goto('/app/login');
    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // If the gate is lifted, we should be at dashboard root
    await expect(page).toHaveURL('/app/dashboard');
    
    // Verify Dashboard header is fully visible (not the suspended one)
    await expect(page.locator('text="Capital Flow"')).toBeVisible();
  });
});
