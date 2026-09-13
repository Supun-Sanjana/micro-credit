import { test, expect } from '@playwright/test';

test('marketing homepage renders at root', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Replace the loan-collection')).toBeVisible();
});
