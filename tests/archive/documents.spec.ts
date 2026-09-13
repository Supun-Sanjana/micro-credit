import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Document Upload E2E', () => {
  test('upload NIC document', async ({ page }) => {
    // 1. Login
    await page.goto('/app/login');
    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 2. Navigate to first member detail
    await page.goto('/app/members');
    
    const memberLink = page.locator('a[href^="/app/members/"]').first();
    // Only proceed if there is a member
    if (await memberLink.isVisible()) {
      await memberLink.click();
      
      // Wait for documents section
      await expect(page.locator('text="Documents"').first()).toBeVisible();
      
      // Set the file input
      const fileInput = page.locator('input[type="file"]');
      const filePath = path.join(__dirname, 'dummy.pdf');
      
      // Select NIC Photo tab
      await page.click('button:has-text("NIC Photo")');
      
      await fileInput.setInputFiles(filePath);
      
      // Upload
      await page.click('button:has-text("Upload NIC_PHOTO")');
      
      // Verify success
      await expect(page.locator('text="dummy.pdf"')).toBeVisible();
    }
  });
});
