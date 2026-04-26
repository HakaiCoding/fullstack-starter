import { test, expect } from '@playwright/test';

test('renders the home page at root route', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'HomePage' })).toBeVisible();
});
