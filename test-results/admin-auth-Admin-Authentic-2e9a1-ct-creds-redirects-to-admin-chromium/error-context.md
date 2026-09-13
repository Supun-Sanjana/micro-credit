# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-auth.spec.ts >> Admin Authentication >> admin login with correct creds redirects to /admin
- Location: tests\e2e\admin-auth.spec.ts:6:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('h1') with timeout 5000ms
  - waiting for locator('h1')

```

```yaml
- alert
- paragraph: Loading platform data...
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Admin Authentication', () => {
  4  |   test.setTimeout(60000);
  5  | 
  6  |   test('admin login with correct creds redirects to /admin', async ({ page }) => {
  7  |     await page.goto('/app/admin/login');
  8  |     await page.waitForLoadState('networkidle');
  9  | 
  10 |     await page.fill('input[name="email"]', 'super@steep.local');
  11 |     await page.fill('input[name="password"]', 'supersecret123');
  12 |     await page.click('button[type="submit"]');
  13 | 
  14 |     await page.waitForLoadState('networkidle');
  15 |     await page.waitForURL('**/admin', { timeout: 15000 });
  16 |     await expect(page).toHaveURL('/app/admin', { timeout: 15000 });
> 17 |     await expect(page.locator('h1')).toBeVisible();
     |                                      ^ Error: expect(locator).toBeVisible() failed
  18 |   });
  19 | 
  20 |   test('admin login with wrong password stays on /admin/login and shows error', async ({ page }) => {
  21 |     await page.goto('/app/admin/login');
  22 |     await page.waitForLoadState('networkidle');
  23 | 
  24 |     await page.fill('input[name="email"]', 'super@steep.local');
  25 |     await page.fill('input[name="password"]', 'wrongpassword');
  26 |     await page.click('button[type="submit"]');
  27 | 
  28 |     await page.waitForLoadState('networkidle');
  29 |     await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 });
  30 |     await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 15000 });
  31 |   });
  32 | });
  33 | 
```