const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:3000/app/login');
  await page.fill('input[type="email"]', 'admin@micro.local');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app/dashboard');
  console.log('Logged in!');
  
  await page.goto('http://localhost:3000/app/documents');
  await page.waitForTimeout(2000);
  console.log('Current URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('BODY:', bodyText.substring(0, 200));
  await browser.close();
})();
