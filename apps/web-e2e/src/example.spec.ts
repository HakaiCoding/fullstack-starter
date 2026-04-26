import { test, expect } from '@playwright/test';

test('renders auth status route with logged-out state', async ({ page }) => {
  await page.goto('/auth-status');

  await expect(page.getByTestId('auth-status-state')).toContainText('Logged out');
  await expect(page.getByTestId('auth-login-form')).toBeVisible();
});

test('redirects the root route to auth status', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/auth-status$/);
  await expect(page.getByTestId('auth-login-form')).toBeVisible();
});
