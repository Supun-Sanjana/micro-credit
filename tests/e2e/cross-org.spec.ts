import { test, expect } from '@playwright/test';

test.describe('Cross-Organization Security', () => {
  test.setTimeout(60000);

  test('rejects collection POST with loanId from another organization', async ({ page }) => {
    // 1. Login as standard Tenant
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

    // 2. POST to /api/collection with fake loanId 'fake_loan_id_cross_org_test'
    const response = await page.request.post('/api/collection', {
      data: {
        date: new Date().toISOString(),
        centreId: 'cuid_centre_123',
        entries: [
          {
            loanId: 'fake_loan_id_cross_org_test',
            scheduleId: 'cuid_schedule_123',
            instalmentNumber: 1,
            amount: 5000,
            status: 'FULL',
            note: 'Hacked payment'
          }
        ]
      }
    });

    // 3. Assert response status is 403
    expect(response.status()).toBe(403);
  });
});
