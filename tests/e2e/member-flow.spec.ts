import { test, expect } from '@playwright/test';

test.describe('Member E2E Flow', () => {
  test('should login, create a member, and upload a document', async ({ page }) => {
    // 1. Log in
    await page.goto('http://localhost:3001/app/login');
    
    await page.locator('input[name="email"]').fill('admin@micro.local');
    await page.locator('input[name="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();

    // Wait for the login to succeed or show an error
    await Promise.race([
      expect(page.getByRole('heading', { name: 'Welcome back' })).toBeHidden({ timeout: 15000 }),
      page.locator('.bg-\\[\\#fbe1d1\\]').innerText().then(msg => {
        if (msg) throw new Error(`Login failed: ${msg}`);
      }).catch(() => new Promise(() => {})) // ignore if not found immediately
    ]).catch(async (e) => {
      // Final check for error if race failed
      const errorMsg = await page.locator('.bg-\\[\\#fbe1d1\\]').innerText().catch(() => null);
      if (errorMsg) throw new Error(`Login failed: ${errorMsg}`);
      throw e;
    });

    // 2. Navigate to Members page
    await page.goto('http://localhost:3001/app/members');

    // Generate random name to ensure unique test data
    const uniqueName = `Test Member ${Date.now()}`;
    const nic = `9${Math.floor(Math.random() * 100000000)}V`;
    
    // Fill out the Register Member form
    // The centre select doesn't have a label for/id, so we use locator('select')
    await page.locator('select').selectOption({ index: 1 }); // Select first available option (index 0 is placeholder)
    
    await page.getByPlaceholder('E.g. Kamal Perera').fill(uniqueName);
    await page.getByPlaceholder('Optional').fill(nic);
    await page.getByPlaceholder('077XXXXXXX').fill('0771234567');
    await page.getByPlaceholder('1-6').fill('1');

    await page.getByRole('button', { name: 'Register' }).click();

    // 3. Search for the member to verify creation
    const searchInput = page.getByPlaceholder('Search by name, NIC, or member no...');
    await searchInput.fill(uniqueName);
    
    // Verify the new member is in the list
    const memberRow = page.getByRole('row', { name: uniqueName });
    await expect(memberRow).toBeVisible();

    // Since mock data doesn't persist across Next.js page navigations (it's stored in local state),
    // we will navigate to an existing member's detail page to test the document upload feature.
    await searchInput.fill(''); // Clear search
    const firstExistingMemberRow = page.getByRole('row').nth(1); // Row 0 is header
    await firstExistingMemberRow.getByRole('link').click();

    // 4. On member detail page, test document upload
    // Wait for load state
    await page.waitForLoadState('networkidle');

    // Wait for the upload section to appear
    await expect(page.getByText('Upload Member Document')).toBeVisible();
    
    // The input file is hidden, but Playwright can interact with it using setInputFiles
    await page.setInputFiles('input[type="file"]', 'test-image.png');

    // Verify preview or file selected state
    await expect(page.getByText('test-image.png')).toBeVisible();

    // Click upload and wait for the API response
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/documents') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Upload', exact: true }).click()
    ]);

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`Upload API failed with status ${response.status()}: ${errorText}`);
    }

    // Wait for success message
    await expect(page.getByText('Document uploaded successfully!')).toBeVisible({ timeout: 15000 });

    // 5. Verify the uploaded document appears in the list
    const uploadedDocsSection = page.locator('.space-y-6 > div:last-child'); // The last card in MemberDocuments
        await expect(uploadedDocsSection.getByText('NIC Photo').first()).toBeVisible();
  });
});
