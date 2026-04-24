import { test, expect } from '@playwright/test';

test('renders minimal app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('router-outlet')).toHaveCount(1);
});
