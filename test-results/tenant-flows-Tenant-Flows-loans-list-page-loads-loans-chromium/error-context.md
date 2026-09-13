# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tenant-flows.spec.ts >> Tenant Flows >> loans list page loads /loans
- Location: tests\e2e\tenant-flows.spec.ts:32:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('main') with timeout 5000ms
  - waiting for locator('main')

```

```yaml
- heading "404" [level=1]
- heading "This page could not be found." [level=2]
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Tenant Flows', () => {
  4  |   test.setTimeout(60000);
  5  | 
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await page.goto('/app/login');
  8  |     await page.waitForLoadState('networkidle');
  9  |     await page.fill('input[type="email"]', 'admin@micro.local');
  10 |     await page.fill('input[name="password"]', 'admin123');
  11 |     await page.click('button[type="submit"]');
  12 |     await page.waitForLoadState('networkidle');
  13 |     await page.waitForURL('**/dashboard', { timeout: 15000 });
  14 |   });
  15 | 
  16 |   test('dashboard page loads /dashboard', async ({ page }) => {
  17 |     await page.goto('/app/dashboard');
  18 |     await expect(page).toHaveURL('/app/dashboard', { timeout: 15000 });
  19 |     await page.waitForLoadState('networkidle');
  20 |     await expect(page.locator('main')).toBeVisible();
  21 |     await expect(page.locator('h1')).toBeVisible();
  22 |   });
  23 | 
  24 |   test('members list page loads /members', async ({ page }) => {
  25 |     await page.goto('/members');
  26 |     await expect(page).toHaveURL('/members', { timeout: 15000 });
  27 |     await page.waitForLoadState('networkidle');
  28 |     await expect(page.locator('main')).toBeVisible();
  29 |     await expect(page.locator('h1')).toBeVisible();
  30 |   });
  31 | 
  32 |   test('loans list page loads /loans', async ({ page }) => {
  33 |     await page.goto('/loans');
  34 |     await expect(page).toHaveURL('/loans', { timeout: 15000 });
  35 |     await page.waitForLoadState('networkidle');
> 36 |     await expect(page.locator('main')).toBeVisible();
     |                                        ^ Error: expect(locator).toBeVisible() failed
  37 |     await expect(page.locator('h1')).toBeVisible();
  38 |   });
  39 | 
  40 |   test('branches page loads /branches', async ({ page }) => {
  41 |     await page.goto('/branches');
  42 |     await expect(page).toHaveURL('/branches', { timeout: 15000 });
  43 |     await page.waitForLoadState('networkidle');
  44 |     await expect(page.locator('main')).toBeVisible();
  45 |     await expect(page.locator('h1')).toBeVisible();
  46 |   });
  47 | 
  48 |   test('centres page loads /centres', async ({ page }) => {
  49 |     await page.goto('/centres');
  50 |     await expect(page).toHaveURL('/centres', { timeout: 15000 });
  51 |     await page.waitForLoadState('networkidle');
  52 |     await expect(page.locator('main')).toBeVisible();
  53 |     await expect(page.locator('h1')).toBeVisible();
  54 |   });
  55 | 
  56 |   test('collection page loads /collection', async ({ page }) => {
  57 |     await page.goto('/collection');
  58 |     await expect(page).toHaveURL('/collection', { timeout: 15000 });
  59 |     await page.waitForLoadState('networkidle');
  60 |     await expect(page.locator('main')).toBeVisible();
  61 |     await expect(page.locator('h1')).toBeVisible();
  62 |   });
  63 | 
  64 |   test('reports page loads /reports', async ({ page }) => {
  65 |     await page.goto('/reports');
  66 |     await expect(page).toHaveURL('/reports', { timeout: 15000 });
  67 |     await page.waitForLoadState('networkidle');
  68 |     await expect(page.locator('main')).toBeVisible();
  69 |     await expect(page.locator('h1')).toBeVisible();
  70 |   });
  71 | 
  72 |   test('settings/billing page loads /settings/billing', async ({ page }) => {
  73 |     await page.goto('/settings/billing');
  74 |     await expect(page).toHaveURL('/settings/billing', { timeout: 15000 });
  75 |     await page.waitForLoadState('networkidle');
  76 |     await expect(page.locator('main')).toBeVisible();
  77 |     await expect(page.locator('h1')).toBeVisible();
  78 |   });
  79 | });
  80 | 
```